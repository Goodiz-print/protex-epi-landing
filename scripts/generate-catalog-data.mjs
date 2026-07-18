#!/usr/bin/env node
// Standalone, manually-run generator for the compact per-supplier catalog data.
// Run manually: `node scripts/generate-catalog-data.mjs`
// Never run by `astro dev`/`astro build`. Reads each supplier's raw CSV export(s)
// (local-only, gitignored, see src/data/suppliers/) plus its category mapping,
// resolves every product exactly like the old runtime CSV loader used to, and
// writes the result to src/data/catalog/products.<supplier>.json — the only
// data files the site actually needs to build.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CATALOG_DIR = resolve(ROOT, 'src/data/catalog');

function readCsv(absPath) {
	const content = readFileSync(absPath, 'utf-8');
	return parse(content, { columns: true, bom: true, trim: true, skip_empty_lines: true });
}

function readMapping(absPath) {
	const raw = readFileSync(absPath, 'utf-8').trim();
	return raw ? JSON.parse(raw) : {};
}

const UNCLASSIFIED = { category: 'a-trier', subcategory: null };

function resolveCategory(mapping, key) {
	return mapping[key] ?? UNCLASSIFIED;
}

/** Picks the first-encountered value deterministically; flags when later rows in the group disagree. */
function resolveDeterministicValue(values) {
	const [value, ...rest] = values;
	const ignoredValues = Array.from(new Set(rest.filter((candidate) => candidate !== value)));
	return { value, hadMismatch: ignoredValues.length > 0, ignoredValues };
}

function slugify(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function buildProductSlug(name, colour, styleCode) {
	return `${slugify(`${name} ${colour}`)}-${slugify(styleCode)}`;
}

function buildEntryId(supplier, styleCode, colour) {
	return `${supplier}:${styleCode}:${slugify(colour)}`;
}

// --- Portwest ---

function groupPortwestRows(rows) {
	const groups = new Map();
	for (const row of rows) {
		const styleCode = row['Style Code'];
		const colour = row['Colour'];
		const key = `${styleCode}::${colour}`;
		let group = groups.get(key);
		if (!group) {
			group = { styleCode, colour, rows: [] };
			groups.set(key, group);
		}
		group.rows.push(row);
	}
	return Array.from(groups.values());
}

function buildSizesList(rows) {
	const seen = new Set();
	const sizes = [];
	for (const row of rows) {
		const size = row['Size'];
		if (size && !seen.has(size)) {
			seen.add(size);
			sizes.push(size);
		}
	}
	return sizes;
}

function buildPortwestProductEntry(supplier, group, mapping, warnings) {
	const firstRow = group.rows[0];
	const name = firstRow['Product'];
	const description = firstRow['Description'];

	const priceResolution = resolveDeterministicValue(group.rows.map((row) => Number(row['Price'])));
	if (priceResolution.hadMismatch) {
		warnings.push(
			`[portwest] price mismatch for styleCode=${group.styleCode} colour="${group.colour}": using ${priceResolution.value}, ignored [${priceResolution.ignoredValues.join(', ')}]`,
		);
	}

	const imageResolution = resolveDeterministicValue(group.rows.map((row) => row['Image']));
	if (imageResolution.hadMismatch) {
		warnings.push(
			`[portwest] image mismatch for styleCode=${group.styleCode} colour="${group.colour}": using ${imageResolution.value}, ignored [${imageResolution.ignoredValues.join(', ')}]`,
		);
	}

	const { category, subcategory } = resolveCategory(mapping, group.styleCode);
	const id = buildEntryId(supplier, group.styleCode, group.colour);
	const slug = buildProductSlug(name, group.colour, group.styleCode);

	return {
		id,
		supplier,
		styleCode: group.styleCode,
		name,
		description,
		colour: group.colour,
		slug,
		price: priceResolution.value,
		currency: 'EUR',
		imageUrl: imageResolution.value,
		sizes: buildSizesList(group.rows),
		category,
		subcategory,
		sourceSkus: group.rows.map((row) => row['Item']),
	};
}

function generatePortwest(warnings) {
	const csvPath = resolve(ROOT, 'src/data/suppliers/portwest/product_sheet_FR_A8_20.csv');
	const mappingPath = resolve(ROOT, 'src/data/category-mapping.portwest.json');

	const rows = readCsv(csvPath);
	const mapping = readMapping(mappingPath);
	const groups = groupPortwestRows(rows);
	const products = groups.map((group) => buildPortwestProductEntry('portwest', group, mapping, warnings));

	console.log(`[portwest] resolved ${products.length} products from ${rows.length} CSV rows`);
	return products;
}

// --- Blaklader (FAB-DIS 3.0 export) ---
//
// REFCIALE is always `<12-char base ref><size suffix>` (e.g. "107916451098C44").
// The base ref groups every size/colour of one article and is also the join key
// used by the media export (B03_MEDIA), which is keyed on the base ref alone.
// The size suffix (e.g. "C44", "XS", "4XL") is Blaklader's own size code and is
// used verbatim as the size value.

const BLAKLADER_BASE_REF_LENGTH = 12;

function blakladerBaseRef(refciale) {
	return refciale.slice(0, BLAKLADER_BASE_REF_LENGTH);
}

function blakladerSize(refciale) {
	return refciale.slice(BLAKLADER_BASE_REF_LENGTH);
}

function groupBlakladerRows(rows) {
	const groups = new Map();
	for (const row of rows) {
		const baseRef = blakladerBaseRef(row['REFCIALE']);
		let group = groups.get(baseRef);
		if (!group) {
			group = { baseRef, rows: [] };
			groups.set(baseRef, group);
		}
		group.rows.push(row);
	}
	return Array.from(groups.values());
}

/** Keyed by full REFCIALE (C03_VARIANTE, VCODE=COL rows: one per REFCIALE). */
function buildBlakladerColourIndex(varianteRows) {
	const index = new Map();
	for (const row of varianteRows) {
		index.set(row['REFCIALE'], row['VARIANTE']);
	}
	return index;
}

/** Keyed by base ref (B03_MEDIA, MTYP=PHOTO rows): picks the lowest-MNUM, highest-resolution photo. */
function buildBlakladerMediaIndex(mediaRows) {
	const photosByBaseRef = new Map();
	for (const row of mediaRows) {
		if (row['MTYP'] !== 'PHOTO') {
			continue;
		}
		const baseRef = row['REFCIALE'];
		let photos = photosByBaseRef.get(baseRef);
		if (!photos) {
			photos = [];
			photosByBaseRef.set(baseRef, photos);
		}
		photos.push(row);
	}

	const index = new Map();
	for (const [baseRef, photos] of photosByBaseRef) {
		const sorted = [...photos].sort((a, b) => Number(a['MNUM']) - Number(b['MNUM']));
		const best = sorted.find((photo) => !photo['MTEXTE'].includes('basse résolution')) ?? sorted[0];
		index.set(baseRef, best['MURL']);
	}
	return index;
}

function buildBlakladerProductEntry(group, colourIndex, mediaIndex, mapping, warnings) {
	const firstRow = group.rows[0];
	const name = firstRow['LIBELLE40'];
	const description = firstRow['LIBELLE240'];

	const colourResolution = resolveDeterministicValue(
		group.rows.map((row) => colourIndex.get(row['REFCIALE']) ?? ''),
	);
	if (colourResolution.hadMismatch) {
		warnings.push(
			`[blaklader] colour mismatch for baseRef=${group.baseRef}: using "${colourResolution.value}", ignored [${colourResolution.ignoredValues.join(', ')}]`,
		);
	}

	const priceResolution = resolveDeterministicValue(
		group.rows.map((row) => Number(row['TARIF'].replace(',', '.'))),
	);
	if (priceResolution.hadMismatch) {
		warnings.push(
			`[blaklader] price mismatch for baseRef=${group.baseRef}: using ${priceResolution.value}, ignored [${priceResolution.ignoredValues.join(', ')}]`,
		);
	}

	const imageUrl = mediaIndex.get(group.baseRef);
	if (!imageUrl) {
		warnings.push(`[blaklader] no image found for baseRef=${group.baseRef}, product skipped`);
		return null;
	}

	const sizes = [];
	const seenSizes = new Set();
	for (const row of group.rows) {
		const size = blakladerSize(row['REFCIALE']);
		if (!seenSizes.has(size)) {
			seenSizes.add(size);
			sizes.push(size);
		}
	}

	const { category, subcategory } = resolveCategory(mapping, group.baseRef);
	const id = buildEntryId('blaklader', group.baseRef, colourResolution.value);
	const slug = buildProductSlug(name, colourResolution.value, group.baseRef);

	return {
		id,
		supplier: 'blaklader',
		styleCode: group.baseRef,
		name,
		description,
		colour: colourResolution.value,
		slug,
		price: priceResolution.value,
		currency: 'EUR',
		imageUrl,
		sizes,
		category,
		subcategory,
		sourceSkus: group.rows.map((row) => row['REFCIALE']),
	};
}

function generateBlaklader(warnings) {
	const dir = resolve(ROOT, 'src/data/suppliers/blaklader');
	const commercePath = resolve(dir, 'Blaklader - FAB-DIS 3.0 - 2026.xlsm - B01_COMMERCE.csv');
	const variantePath = resolve(dir, 'Blaklader - FAB-DIS 3.0 - 2026.xlsm - C03_VARIANTE.csv');
	const mediaPath = resolve(dir, 'Blaklader - FAB-DIS 3.0 - 2026.xlsm - B03_MEDIA.csv');
	const mappingPath = resolve(ROOT, 'src/data/category-mapping.blaklader.json');

	const commerceRows = readCsv(commercePath);
	const colourIndex = buildBlakladerColourIndex(readCsv(variantePath));
	const mediaIndex = buildBlakladerMediaIndex(readCsv(mediaPath));
	const mapping = readMapping(mappingPath);

	const groups = groupBlakladerRows(commerceRows);
	const products = groups
		.map((group) => buildBlakladerProductEntry(group, colourIndex, mediaIndex, mapping, warnings))
		.filter((product) => product !== null);

	console.log(
		`[blaklader] resolved ${products.length} products from ${groups.length} groups / ${commerceRows.length} CSV rows`,
	);
	return products;
}

function writeCatalogJson(supplier, products) {
	if (!existsSync(CATALOG_DIR)) {
		mkdirSync(CATALOG_DIR, { recursive: true });
	}
	const outPath = resolve(CATALOG_DIR, `products.${supplier}.json`);
	writeFileSync(outPath, `${JSON.stringify(products, null, 2)}\n`, 'utf-8');
	console.log(`Written to ${outPath}`);
}

function main() {
	const warnings = [];

	writeCatalogJson('portwest', generatePortwest(warnings));
	writeCatalogJson('blaklader', generateBlaklader(warnings));

	if (warnings.length > 0) {
		console.log(`\n${warnings.length} warning(s):`);
		for (const warning of warnings) {
			console.warn(`  ${warning}`);
		}
	}
}

main();
