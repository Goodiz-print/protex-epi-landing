#!/usr/bin/env node
// Live-checks the product image URLs (Portwest, Mascot, Blaklader) via HTTP HEAD/GET and
// bakes the result into the committed catalog, so the site never ships a card whose photo
// is known to be dead.
//
// Run manually: `pnpm run check:images` (= `node scripts/check-product-images.mjs`).
// Never run by `astro dev`/`astro build`. It makes one request per distinct URL (~25 000),
// so it takes several minutes.
//
// Where the candidate URLs come from, per supplier:
//  - the raw export in src/data/suppliers/<supplier>/ when it is present on this machine
//    (every image the export lists for a style+colour, i.e. alternates included);
//  - otherwise the committed catalog src/data/catalog/products.<supplier>.json (the URL each
//    product currently uses), completed with URLs derived from the supplier's deterministic
//    naming scheme (Portwest: styles1100px/<style+colour>.jpg from the SKUs; Mascot:
//    pimage.mascot.fr/<produit-qualité-coloris>_P01_1000pxweb.jpg). A checkout without the
//    exports can therefore run the check and even recover photos for placeholder products.
//
// Writes (skipped with --dry-run):
//  - src/data/catalog/products.<supplier>.json: each product keeps its URL when it is alive,
//    otherwise takes the first alive candidate, otherwise the local placeholder.
//  - src/data/image-overrides.<supplier>.json: a photo recovered through a derived URL is
//    recorded there so `generate-catalog-data.mjs` keeps it on the next regeneration.
//  - src/data/known-bad-images.portwest.json: Portwest CDN URLs confirmed dead, merged with
//    the previous list (an entry checked alive again is dropped). Consumed by
//    generate-catalog-data.mjs to pick an alternate image from the export.
//  - scripts/reports/broken-product-images.json: every product still without a valid image,
//    i.e. what renders with the placeholder (and what the loader hides when it has no price
//    either — see src/utils/product-image.ts).
//
// A transport failure (DNS, timeout, proxy refusal, 429, 5xx) is NOT a dead link: the URL is
// reported as "unknown" and left untouched. When more than UNKNOWN_ABORT_RATIO of the URLs
// are unknown the run is considered offline and nothing is written.
//
// Options:
//   --supplier portwest,mascot   only these suppliers (default: all three)
//   --source csv|catalog         force the candidate source (default: auto, csv when present)
//   --dry-run                    check and report on stdout only, write nothing
//   --concurrency 24             parallel requests

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'csv-parse/sync';
import { applyImageOverrides, readImageOverrides } from './lib/image-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ROOT = resolve(__dirname, '..');

export const PLACEHOLDER_IMAGE_URL = '/images/product-placeholder.svg';
const PORTWEST_CDN = 'https://d11ak7fd9ypfb7.cloudfront.net/styles1100px/';
const MASCOT_CDN = 'https://pimage.mascot.fr/';
const BLAKLADER_BASE_REF_LENGTH = 12;
// Same allowlist as scripts/lib/supplier-csv.ts.
const RASTER_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)(\?|$)/i;

const SUPPLIERS = ['portwest', 'mascot', 'blaklader'];
const REQUEST_TIMEOUT_MS = 6000;
const UNKNOWN_ABORT_RATIO = 0.2;

const EXPORTS = {
	portwest: { csv: 'src/data/suppliers/portwest/product_sheet_FR_A8_20.csv' },
	mascot: { csv: 'src/data/suppliers/mascot/mascot-products.slim.csv' },
	blaklader: {
		commerce: 'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B01_COMMERCE.csv',
		media: 'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B03_MEDIA.csv',
	},
};

function readCsv(absPath, delimiter = ',') {
	const content = readFileSync(absPath, 'utf-8');
	return parse(content, { columns: true, bom: true, trim: true, skip_empty_lines: true, delimiter });
}

function readJson(absPath) {
	return JSON.parse(readFileSync(absPath, 'utf-8'));
}

/** Same one-product-per-line layout as writeCatalog() in generate-catalog-data.mjs. */
function writeCatalog(absPath, products) {
	const body = products.map((product) => JSON.stringify(product)).join(',\n');
	writeFileSync(absPath, `[\n${body}\n]\n`, 'utf-8');
}

// --- Matching a catalog product with the export's grouping key ---------------------------

/** Key shared by a catalog product and the export group it was built from. */
export function productGroupKey(product) {
	switch (product.supplier) {
		case 'portwest':
			return `${product.styleCode}::${product.colour}`;
		case 'mascot':
			// id = mascot:<produit-qualité-coloris>:<colour-slug>
			return product.id.split(':')[1];
		case 'blaklader':
			return product.styleCode.slice(0, BLAKLADER_BASE_REF_LENGTH);
		default:
			return product.id;
	}
}

// --- Candidate URLs derived from the suppliers' deterministic naming schemes --------------

/**
 * Portwest: <styleCode><colourCode>.jpg, the SKU being <styleCode><colourCode><size> with a
 * 3-character colour code (rule verified against every image URL of the catalog).
 */
export function derivePortwestCandidates(product) {
	const styleCode = product.styleCode ?? '';
	const bases = new Set();
	for (const sku of product.sourceSkus ?? []) {
		if (styleCode && sku.startsWith(styleCode) && sku.length >= styleCode.length + 3) {
			bases.add(sku.slice(0, styleCode.length + 3));
		}
	}
	return [...bases].map((base) => `${PORTWEST_CDN}${base}.jpg`);
}

/** Mascot: <produit-qualité-coloris>_P01_1000pxweb.jpg (older products: _P_). */
export function deriveMascotCandidates(product) {
	const groupKey = productGroupKey(product);
	if (!groupKey) return [];
	return [`${MASCOT_CDN}${groupKey}_P01_1000pxweb.jpg`, `${MASCOT_CDN}${groupKey}_P_1000pxweb.jpg`];
}

const DERIVERS = {
	portwest: derivePortwestCandidates,
	mascot: deriveMascotCandidates,
	blaklader: () => [],
};

// --- Candidate URLs listed by the raw exports ---------------------------------------------

function exportCandidatesPortwest(root) {
	const byKey = new Map();
	for (const row of readCsv(resolve(root, EXPORTS.portwest.csv))) {
		const key = `${row['Style Code']}::${row['Colour']}`;
		const urls = byKey.get(key) ?? [];
		if (row['Image'] && !urls.includes(row['Image'])) urls.push(row['Image']);
		byKey.set(key, urls);
	}
	return byKey;
}

function exportCandidatesMascot(root) {
	const byKey = new Map();
	for (const row of readCsv(resolve(root, EXPORTS.mascot.csv), ';')) {
		const key = row['produitQualiteColoris'];
		if (byKey.has(key)) continue;
		byKey.set(key, row['image1000'] ? [row['image1000']] : []);
	}
	return byKey;
}

function exportCandidatesBlaklader(root) {
	const photosByBaseRef = new Map();
	for (const row of readCsv(resolve(root, EXPORTS.blaklader.media))) {
		if (row['MTYP'] !== 'PHOTO') continue;
		const photos = photosByBaseRef.get(row['REFCIALE']) ?? [];
		photos.push(row);
		photosByBaseRef.set(row['REFCIALE'], photos);
	}
	const byKey = new Map();
	for (const [baseRef, photos] of photosByBaseRef) {
		const sorted = [...photos].sort((a, b) => Number(a['MNUM']) - Number(b['MNUM']));
		byKey.set(
			baseRef,
			[...new Set(sorted.map((photo) => photo['MURL']).filter((url) => RASTER_IMAGE_EXTENSION.test(url)))],
		);
	}
	return byKey;
}

const EXPORT_READERS = {
	portwest: exportCandidatesPortwest,
	mascot: exportCandidatesMascot,
	blaklader: exportCandidatesBlaklader,
};

export function exportIsPresent(root, supplier) {
	return Object.values(EXPORTS[supplier]).every((path) => existsSync(resolve(root, path)));
}

// --- Entry collection ---------------------------------------------------------------------

/**
 * One entry per catalog product: its candidate URLs in preference order (current URL first,
 * then the export's alternates, then derived URLs), each tagged with its origin.
 */
export function collectEntries(root, supplier, source) {
	const catalogPath = resolve(root, `src/data/catalog/products.${supplier}.json`);
	const products = readJson(catalogPath);
	const exportCandidates = source === 'csv' ? EXPORT_READERS[supplier](root) : null;
	const derive = DERIVERS[supplier];

	const entries = products.map((product) => {
		const candidates = [];
		const push = (url, origin) => {
			if (url && url !== PLACEHOLDER_IMAGE_URL && !candidates.some((candidate) => candidate.url === url)) {
				candidates.push({ url, origin });
			}
		};
		push(product.imageUrl, 'catalog');
		for (const url of exportCandidates?.get(productGroupKey(product)) ?? []) push(url, 'export');
		for (const url of derive(product)) push(url, 'derived');
		return { product, candidates };
	});

	return { catalogPath, products, entries };
}

// --- Live HTTP validation -----------------------------------------------------------------

/** ok = alive, dead = the server says the image is gone, unknown = could not tell. */
export function classifyStatus(status) {
	if (status >= 200 && status < 300) return 'ok';
	if (status >= 400 && status < 500 && status !== 429) return 'dead';
	return 'unknown';
}

async function checkUrl(url, fetchImpl) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		let res = await fetchImpl(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
		if (res.status === 405 || res.status === 501) {
			res = await fetchImpl(url, { method: 'GET', signal: controller.signal, redirect: 'follow' });
		}
		return { status: res.status, verdict: classifyStatus(res.status) };
	} catch (error) {
		return { status: 0, verdict: 'unknown', error: error.message };
	} finally {
		clearTimeout(timeout);
	}
}

async function checkAllUrls(urls, { fetchImpl, concurrency, log }) {
	const results = new Map();
	const queue = [...urls];
	let checked = 0;

	async function worker() {
		while (queue.length > 0) {
			const url = queue.shift();
			results.set(url, await checkUrl(url, fetchImpl));
			checked += 1;
			if (checked % 250 === 0 || checked === urls.length) log(`  checked ${checked}/${urls.length}`);
		}
	}

	await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));
	return results;
}

// --- Main ---------------------------------------------------------------------------------

export function parseArgs(argv) {
	const options = { suppliers: SUPPLIERS, source: 'auto', dryRun: false, concurrency: 24 };
	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];
		// `pnpm run check:images -- --dry-run` forwards the separator itself.
		if (arg === '--') continue;
		if (arg === '--dry-run') options.dryRun = true;
		else if (arg === '--supplier') options.suppliers = argv[++index].split(',').map((value) => value.trim());
		else if (arg === '--source') options.source = argv[++index];
		else if (arg === '--concurrency') options.concurrency = Number(argv[++index]);
		else throw new Error(`Unknown option ${arg}`);
	}
	for (const supplier of options.suppliers) {
		if (!SUPPLIERS.includes(supplier)) throw new Error(`Unknown supplier ${supplier}`);
	}
	if (!['auto', 'csv', 'catalog'].includes(options.source)) throw new Error(`Unknown source ${options.source}`);
	return options;
}

export async function run({ root = DEFAULT_ROOT, fetchImpl = globalThis.fetch, log = console.log, ...options } = {}) {
	const { suppliers, source, dryRun, concurrency } = { ...parseArgs([]), ...options };

	// 1. Candidates.
	const perSupplier = new Map();
	for (const supplier of suppliers) {
		let resolvedSource = source;
		if (source === 'auto') resolvedSource = exportIsPresent(root, supplier) ? 'csv' : 'catalog';
		if (resolvedSource === 'csv' && !exportIsPresent(root, supplier)) {
			throw new Error(`${supplier}: export not found in src/data/suppliers/${supplier}/ (use --source catalog)`);
		}
		const collected = collectEntries(root, supplier, resolvedSource);
		perSupplier.set(supplier, { ...collected, source: resolvedSource });
		log(`[${supplier}] ${collected.products.length} products, candidates from ${resolvedSource === 'csv' ? 'the raw export' : 'the committed catalog'}`);
	}

	// 2. Live check.
	const allUrls = [
		...new Set([...perSupplier.values()].flatMap(({ entries }) => entries.flatMap((entry) => entry.candidates.map((c) => c.url)))),
	];
	log(`Checking ${allUrls.length} distinct image URLs (concurrency ${concurrency})...`);
	const results = await checkAllUrls(allUrls, { fetchImpl, concurrency, log });
	const counts = { ok: 0, dead: 0, unknown: 0 };
	for (const result of results.values()) counts[result.verdict] += 1;
	const offline = allUrls.length > 0 && counts.unknown / allUrls.length > UNKNOWN_ABORT_RATIO;

	// 3. Decide each product's image.
	const brokenEntries = [];
	const changes = new Map(); // supplier → { catalog: n, overrides: n }
	const knownBadPortwest = new Set(
		existsSync(resolve(root, 'src/data/known-bad-images.portwest.json'))
			? readJson(resolve(root, 'src/data/known-bad-images.portwest.json'))
			: [],
	);
	const verdictOf = (url) => results.get(url)?.verdict ?? 'unknown';

	for (const [supplier, { entries, products, catalogPath }] of perSupplier) {
		const overridesPath = resolve(root, `src/data/image-overrides.${supplier}.json`);
		const overrides = existsSync(overridesPath) ? readJson(overridesPath) : {};
		const change = { catalog: 0, overrides: 0 };

		for (const { product, candidates } of entries) {
			if (supplier === 'portwest') {
				for (const { url } of candidates) {
					if (!url.startsWith(PORTWEST_CDN)) continue;
					if (verdictOf(url) === 'dead') knownBadPortwest.add(url);
					else if (verdictOf(url) === 'ok') knownBadPortwest.delete(url);
				}
			}

			const current = candidates.find((candidate) => candidate.url === product.imageUrl);
			let chosen = current && verdictOf(current.url) !== 'dead' ? current : null;
			if (!chosen) chosen = candidates.find((candidate) => verdictOf(candidate.url) === 'ok') ?? null;

			const nextUrl = chosen?.url ?? PLACEHOLDER_IMAGE_URL;
			if (nextUrl !== product.imageUrl) {
				product.imageUrl = nextUrl;
				change.catalog += 1;
			}
			if (chosen?.origin === 'derived' && overrides[product.id] !== chosen.url) {
				overrides[product.id] = chosen.url;
				change.overrides += 1;
			}
			if (!chosen) {
				brokenEntries.push({
					supplier,
					id: product.id,
					styleCode: product.styleCode,
					colour: product.colour,
					name: product.name,
					price: product.price,
					sourceSkus: product.sourceSkus,
					candidateUrls: candidates.map((candidate) => candidate.url),
					statuses: candidates.map((candidate) => ({ url: candidate.url, origin: candidate.origin, ...results.get(candidate.url) })),
					usingPlaceholder: true,
				});
			}
		}

		changes.set(supplier, change);
		if (!dryRun && !offline) {
			if (change.catalog > 0) writeCatalog(catalogPath, products);
			if (change.overrides > 0) writeFileSync(overridesPath, `${JSON.stringify(overrides, null, '\t')}\n`, 'utf-8');
			// Keep the committed catalog and the overrides file consistent.
			applyImageOverrides(products, readImageOverrides(overridesPath));
		}
	}

	// 4. Outputs.
	const summary = {
		checkedAt: new Date().toISOString(),
		checkedUrls: allUrls.length,
		urls: counts,
		source: Object.fromEntries([...perSupplier].map(([supplier, { source }]) => [supplier, source])),
		products: Object.fromEntries([...perSupplier].map(([supplier, { products }]) => [supplier, products.length])),
		catalogProductsUpdated: Object.fromEntries([...changes].map(([supplier, change]) => [supplier, change.catalog])),
		imagesRecoveredByDerivedUrl: Object.fromEntries([...changes].map(([supplier, change]) => [supplier, change.overrides])),
		productsStillWithoutImage: brokenEntries.length,
	};

	log('\n--- Summary ---');
	log(JSON.stringify(summary, null, 2));

	if (offline) {
		log(
			`\n${counts.unknown}/${allUrls.length} URLs could not be checked (network problem?): nothing written.`,
		);
		return { summary, brokenEntries, written: false };
	}
	if (dryRun) {
		log('\n--dry-run: nothing written.');
		return { summary, brokenEntries, written: false };
	}

	if (suppliers.includes('portwest')) {
		const knownBadPath = resolve(root, 'src/data/known-bad-images.portwest.json');
		writeFileSync(knownBadPath, `${JSON.stringify([...knownBadPortwest].sort(), null, '\t')}\n`);
		log(`Wrote ${knownBadPath} (${knownBadPortwest.size} dead Portwest URLs)`);
	}
	const reportPath = resolve(root, 'scripts/reports/broken-product-images.json');
	mkdirSync(dirname(reportPath), { recursive: true });
	writeFileSync(reportPath, `${JSON.stringify({ summary, brokenEntries }, null, '\t')}\n`);
	log(`Wrote ${reportPath} (${brokenEntries.length} products still without a valid image)`);
	for (const [supplier, change] of changes) {
		if (change.catalog > 0) log(`Patched src/data/catalog/products.${supplier}.json (${change.catalog} products)`);
		if (change.overrides > 0) log(`Recorded ${change.overrides} recovered URL(s) in src/data/image-overrides.${supplier}.json`);
	}
	log('Commit the catalog, overrides, known-bad list and report together.');
	return { summary, brokenEntries, written: true };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	Promise.resolve()
		.then(() => run(parseArgs(process.argv.slice(2))))
		.catch((error) => {
			console.error(error.message);
			process.exit(1);
		});
}
