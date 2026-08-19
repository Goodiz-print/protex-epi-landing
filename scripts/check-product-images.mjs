#!/usr/bin/env node
// Live-checks every product image URL (Portwest, Mascot, Blaklader) via HTTP HEAD/GET.
// Run manually: `node scripts/check-product-images.mjs` (or `pnpm run check:images`).
// Never run by `astro dev`/`astro build`.
//
// Writes:
//  - src/data/known-bad-images.portwest.json: full replace, list of Portwest CDN URLs
//    confirmed dead. Consumed at build/dev time by csv-products-loader.ts so it can pick
//    an alternate image from the same style+colour group when one is available.
//  - scripts/reports/broken-product-images.json: every product that still has no valid
//    image after picking alternates, i.e. what will render with the placeholder.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PORTWEST_CSV = resolve(ROOT, 'src/data/suppliers/portwest/product_sheet_FR_A8_20.csv');
const MASCOT_CSV = resolve(ROOT, 'src/data/suppliers/mascot/mascot-products.slim.csv');
const BLAKLADER_COMMERCE_CSV = resolve(
	ROOT,
	'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B01_COMMERCE.csv',
);
const BLAKLADER_MEDIA_CSV = resolve(
	ROOT,
	'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B03_MEDIA.csv',
);

const KNOWN_BAD_PORTWEST_PATH = resolve(ROOT, 'src/data/known-bad-images.portwest.json');
const REPORT_PATH = resolve(ROOT, 'scripts/reports/broken-product-images.json');

const BLAKLADER_BASE_REF_LENGTH = 12;
// Same allowlist as src/content/loaders/csv-products-loader.helpers.ts.
const RASTER_IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif)(\?|$)/i;

const CONCURRENCY = 24;
const REQUEST_TIMEOUT_MS = 6000;

function readCsv(absPath, delimiter = ',') {
	const content = readFileSync(absPath, 'utf-8');
	return parse(content, { columns: true, bom: true, trim: true, skip_empty_lines: true, delimiter });
}

// --- Collect candidate image URL(s) per product, mirroring the loader's grouping logic ---

function collectPortwestEntries() {
	const rows = readCsv(PORTWEST_CSV);
	const groups = new Map();
	for (const row of rows) {
		const key = `${row['Style Code']}::${row['Colour']}`;
		let group = groups.get(key);
		if (!group) {
			group = { styleCode: row['Style Code'], colour: row['Colour'], sourceSkus: [], images: [] };
			groups.set(key, group);
		}
		group.sourceSkus.push(row['Item']);
		if (row['Image'] && !group.images.includes(row['Image'])) {
			group.images.push(row['Image']);
		}
	}
	const entries = Array.from(groups.values()).map((group) => ({
		supplier: 'portwest',
		styleCode: group.styleCode,
		colour: group.colour,
		sourceSkus: group.sourceSkus,
		candidateUrls: group.images,
	}));
	const mismatchCount = entries.filter((entry) => entry.candidateUrls.length > 1).length;
	return { entries, mismatchCount };
}

function collectMascotEntries() {
	const rows = readCsv(MASCOT_CSV, ';');
	const groups = new Map();
	for (const row of rows) {
		const key = row['produitQualiteColoris'];
		let group = groups.get(key);
		if (!group) {
			group = { produitQualiteColoris: key, colour: row['coloris'], sourceSkus: [], imageUrl: row['image1000'] };
			groups.set(key, group);
		}
		group.sourceSkus.push(row['ean']);
	}
	const entries = Array.from(groups.values()).map((group) => ({
		supplier: 'mascot',
		styleCode: group.produitQualiteColoris,
		colour: group.colour,
		sourceSkus: group.sourceSkus,
		candidateUrls: group.imageUrl ? [group.imageUrl] : [],
	}));
	return { entries };
}

function collectBlakladerEntries() {
	const commerceRows = readCsv(BLAKLADER_COMMERCE_CSV);
	const mediaRows = readCsv(BLAKLADER_MEDIA_CSV);

	const photosByBaseRef = new Map();
	for (const row of mediaRows) {
		if (row['MTYP'] !== 'PHOTO') continue;
		const baseRef = row['REFCIALE'];
		let photos = photosByBaseRef.get(baseRef);
		if (!photos) {
			photos = [];
			photosByBaseRef.set(baseRef, photos);
		}
		photos.push(row);
	}

	const rasterCandidatesByBaseRef = new Map();
	let nonRasterOnlyCount = 0;
	for (const [baseRef, photos] of photosByBaseRef) {
		const sorted = [...photos].sort((a, b) => Number(a['MNUM']) - Number(b['MNUM']));
		const raster = Array.from(new Set(sorted.map((p) => p['MURL']).filter((url) => RASTER_IMAGE_EXTENSION.test(url))));
		if (raster.length === 0) {
			nonRasterOnlyCount += 1;
			continue;
		}
		rasterCandidatesByBaseRef.set(baseRef, raster);
	}

	const groups = new Map();
	for (const row of commerceRows) {
		const baseRef = row['REFCIALE'].slice(0, BLAKLADER_BASE_REF_LENGTH);
		let group = groups.get(baseRef);
		if (!group) {
			group = { baseRef, sourceSkus: [] };
			groups.set(baseRef, group);
		}
		group.sourceSkus.push(row['REFCIALE']);
	}

	const entries = Array.from(groups.values()).map((group) => ({
		supplier: 'blaklader',
		styleCode: group.baseRef,
		colour: null,
		sourceSkus: group.sourceSkus,
		candidateUrls: rasterCandidatesByBaseRef.get(group.baseRef) ?? [],
	}));
	return { entries, nonRasterOnlyCount };
}

// --- Live HTTP validation ---

async function checkUrl(url) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	try {
		let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
		if (res.status === 405 || res.status === 501) {
			res = await fetch(url, { method: 'GET', signal: controller.signal });
		}
		return { ok: res.ok, status: res.status };
	} catch (error) {
		return { ok: false, status: 0, error: error.message };
	} finally {
		clearTimeout(timeout);
	}
}

async function checkAllUrls(urls) {
	const results = new Map();
	const queue = [...urls];
	let checked = 0;

	async function worker() {
		while (queue.length > 0) {
			const url = queue.shift();
			results.set(url, await checkUrl(url));
			checked += 1;
			if (checked % 250 === 0 || checked === urls.length) {
				console.log(`  checked ${checked}/${urls.length}`);
			}
		}
	}

	await Promise.all(Array.from({ length: Math.min(CONCURRENCY, urls.length) }, () => worker()));
	return results;
}

async function main() {
	console.log('Collecting candidate image URLs from supplier CSVs...');
	const portwest = collectPortwestEntries();
	const mascot = collectMascotEntries();
	const blaklader = collectBlakladerEntries();
	const allEntries = [...portwest.entries, ...mascot.entries, ...blaklader.entries];

	const allUrls = Array.from(new Set(allEntries.flatMap((entry) => entry.candidateUrls)));
	console.log(`Checking ${allUrls.length} distinct image URLs (concurrency ${CONCURRENCY})...`);
	const results = await checkAllUrls(allUrls);

	const knownBadPortwestUrls = new Set();
	const brokenEntries = [];

	for (const entry of allEntries) {
		if (entry.supplier === 'portwest') {
			for (const url of entry.candidateUrls) {
				if (!results.get(url)?.ok) {
					knownBadPortwestUrls.add(url);
				}
			}
		}
		const hasValidUrl = entry.candidateUrls.some((url) => results.get(url)?.ok);
		if (!hasValidUrl) {
			brokenEntries.push({
				supplier: entry.supplier,
				styleCode: entry.styleCode,
				colour: entry.colour,
				sourceSkus: entry.sourceSkus,
				candidateUrls: entry.candidateUrls,
				statuses: entry.candidateUrls.map((url) => ({ url, ...results.get(url) })),
				usingPlaceholder: true,
			});
		}
	}

	mkdirSync(dirname(REPORT_PATH), { recursive: true });
	writeFileSync(KNOWN_BAD_PORTWEST_PATH, `${JSON.stringify(Array.from(knownBadPortwestUrls).sort(), null, '\t')}\n`);

	const brokenUrlCount = Array.from(results.values()).filter((result) => !result.ok).length;
	const summary = {
		checkedUrls: allUrls.length,
		brokenUrls: brokenUrlCount,
		products: {
			portwest: portwest.entries.length,
			mascot: mascot.entries.length,
			blaklader: blaklader.entries.length,
		},
		productsStillWithoutImage: brokenEntries.length,
		recurringIssues: {
			portwestGroupsWithMismatchedSizeImages: portwest.mismatchCount,
			blakladerBaseRefsWithOnlyNonRasterPhotos: blaklader.nonRasterOnlyCount,
		},
	};

	writeFileSync(REPORT_PATH, `${JSON.stringify({ summary, brokenEntries }, null, '\t')}\n`);

	console.log('\n--- Summary ---');
	console.log(JSON.stringify(summary, null, 2));
	console.log(`\nWrote ${KNOWN_BAD_PORTWEST_PATH} (${knownBadPortwestUrls.size} dead Portwest URLs)`);
	console.log(`Wrote ${REPORT_PATH} (${brokenEntries.length} products still without a valid image)`);
}

main();
