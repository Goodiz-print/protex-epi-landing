#!/usr/bin/env node
// Names the catalog products the supplier export left without a name and applies the manual
// product fixes (see scripts/lib/complete-products.mjs): unlabelled colourways get their
// model's name and a colour from their SKU; src/data/product-overrides.<supplier>.json names
// whole references and renames / fixes others; every product's text is normalised. Patches the committed catalog JSON without
// needing the supplier CSVs. Idempotent — rerun it whenever an overrides file changes.
//
// Run manually: `node scripts/complete-catalog.mjs` (or `pnpm run complete:catalog`)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { completeProducts, readProductOverrides } from './lib/complete-products.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SUPPLIERS = ['portwest', 'mascot', 'blaklader'];

/** Same one-product-per-line layout as writeCatalog() in generate-catalog-data.mjs. */
function writeCatalog(path, products) {
	const body = products.map((product) => JSON.stringify(product)).join(',\n');
	writeFileSync(path, `[\n${body}\n]\n`, 'utf-8');
}

for (const supplier of SUPPLIERS) {
	const overrides = readProductOverrides(resolve(ROOT, `src/data/product-overrides.${supplier}.json`));
	const catalogPath = resolve(ROOT, `src/data/catalog/products.${supplier}.json`);
	const { products, report } = completeProducts(supplier, JSON.parse(readFileSync(catalogPath, 'utf-8')), overrides);
	if (report.named + report.renamed + report.coloured + report.normalised + report.merged > 0) writeCatalog(catalogPath, products);

	const stillBlank = products.filter((product) => !product.name.trim()).length;
	console.log(
		`${supplier}: ${report.named} product(s) named, ${report.renamed} renamed, ${report.coloured} recoloured, ${report.normalised} with text normalised, ${report.merged} merged into an existing colourway, ${stillBlank} still without a name`,
	);
	if (report.unknownColourCodes.length > 0) {
		console.warn(`${supplier}: unknown colour code for ${report.unknownColourCodes.join(', ')}`);
	}
	if (report.unmatchedOverrides.length > 0) {
		console.warn(`${supplier}: override(s) match no product: ${report.unmatchedOverrides.join(', ')}`);
	}
}
