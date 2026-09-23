#!/usr/bin/env node
// Patches the committed catalog JSON with the manual image overrides
// (src/data/image-overrides.<supplier>.json), without needing the supplier CSVs.
// Idempotent — rerun it whenever an overrides file changes.
//
// Run manually: `node scripts/apply-image-overrides.mjs`

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyImageOverrides, readImageOverrides } from './lib/image-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SUPPLIERS = ['portwest', 'mascot', 'blaklader'];

/** Same one-product-per-line layout as writeCatalog() in generate-catalog-data.mjs. */
function writeCatalog(path, products) {
	const body = products.map((product) => JSON.stringify(product)).join(',\n');
	writeFileSync(path, `[\n${body}\n]\n`, 'utf-8');
}

for (const supplier of SUPPLIERS) {
	const overridesPath = resolve(ROOT, `src/data/image-overrides.${supplier}.json`);
	if (!existsSync(overridesPath)) continue;
	const overrides = readImageOverrides(overridesPath);

	const catalogPath = resolve(ROOT, `src/data/catalog/products.${supplier}.json`);
	const products = JSON.parse(readFileSync(catalogPath, 'utf-8'));
	const { changed, unknown } = applyImageOverrides(products, overrides);
	if (changed > 0) writeCatalog(catalogPath, products);

	console.log(`${supplier}: ${Object.keys(overrides).length} image override(s) — ${changed} catalog product(s) updated`);
	if (unknown.length > 0) {
		console.warn(`${supplier}: ${unknown.length} override(s) match no catalog product: ${unknown.join(', ')}`);
	}
}
