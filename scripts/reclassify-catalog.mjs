#!/usr/bin/env node
// Applies the manual category overrides (src/data/category-overrides.<supplier>.json) to
// BOTH the category mapping (source of truth for the next `generate-catalog-data.mjs` run)
// AND the committed catalog JSON that the site actually builds from.
//
// Why a separate step: the raw supplier CSVs are gitignored and only exist on local
// machines, so a checkout without them cannot regenerate the catalog. This script lets a
// reclassification land in `src/data/catalog/products.<supplier>.json` without the CSVs.
// It is idempotent — rerun it any time the overrides file changes.
//
// Run manually: `node scripts/reclassify-catalog.mjs`

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SUPPLIERS = ['portwest', 'mascot', 'blaklader'];

/**
 * Key of a catalog product in the category mapping — the same key the builders in
 * scripts/lib/supplier-csv.ts pass to resolveCategory(): the Portwest style code, the
 * Blaklader base ref, and for Mascot the product number without its quality suffix
 * (catalog styleCode `24150-M99` → mapping key `24150`).
 */
function mappingKey(supplier, product) {
	return supplier === 'mascot' ? product.styleCode.split('-')[0] : product.styleCode;
}

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf-8'));
}

/** Same one-product-per-line layout as writeCatalog() in generate-catalog-data.mjs. */
function writeCatalog(path, products) {
	const body = products.map((product) => JSON.stringify(product)).join(',\n');
	writeFileSync(path, `[\n${body}\n]\n`, 'utf-8');
}

for (const supplier of SUPPLIERS) {
	const overridesPath = resolve(ROOT, `src/data/category-overrides.${supplier}.json`);
	if (!existsSync(overridesPath)) continue;

	const overrides = Object.fromEntries(
		Object.entries(readJson(overridesPath)).filter(([key]) => !key.startsWith('_')),
	);

	// 1. Mapping: overwrite (or add) the entry for every overridden mapping key.
	const mappingPath = resolve(ROOT, `src/data/category-mapping.${supplier}.json`);
	const mapping = readJson(mappingPath);
	let mappingChanges = 0;
	for (const [styleCode, { category, subcategory }] of Object.entries(overrides)) {
		const current = mapping[styleCode];
		if (current?.category === category && current?.subcategory === subcategory) continue;
		mapping[styleCode] = { category, subcategory };
		mappingChanges++;
	}
	writeFileSync(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf-8');

	// 2. Committed catalog: patch every colourway (and, for Mascot, every quality) of the
	//    overridden keys.
	const catalogPath = resolve(ROOT, `src/data/catalog/products.${supplier}.json`);
	const products = readJson(catalogPath);
	let productChanges = 0;
	const unknown = new Set(Object.keys(overrides));
	for (const product of products) {
		const key = mappingKey(supplier, product);
		const override = overrides[key];
		if (!override) continue;
		unknown.delete(key);
		if (product.category === override.category && product.subcategory === override.subcategory) continue;
		product.category = override.category;
		product.subcategory = override.subcategory;
		productChanges++;
	}
	writeCatalog(catalogPath, products);

	console.log(
		`${supplier}: ${Object.keys(overrides).length} overrides — ${mappingChanges} mapping entries updated, ${productChanges} catalog products updated`,
	);
	if (unknown.size > 0) {
		console.warn(`${supplier}: ${unknown.size} override(s) match no catalog product: ${[...unknown].join(', ')}`);
	}
}
