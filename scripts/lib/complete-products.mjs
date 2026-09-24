// Fills in catalog products that the supplier export left without a name.
//
// Portwest ships price-list rows that have no product sheet: no name, no colour, no
// description — only a SKU, a price and a photo. Mascot has a few qualities without a
// name. Such rows are either:
//   - an unlabelled colourway of a model whose other colourways are named → the name and
//     description are taken from those siblings, the colour from the SKU colour code; when
//     that colour already exists on the model, its sizes/SKUs are merged into it;
//   - a whole reference with no named sibling → the name comes from
//     `src/data/product-overrides.<supplier>.json` (keyed by catalog styleCode, filled by
//     hand or from a web lookup; `source` / `confidence` fields are informative only).
// An override may also carry `colours: { "<Portwest colour code>": "<French colour>" }`: it
// wins for that model, and names the code for the whole catalog when no product does
// (e.g. `"AQR": "Aqua"`).
// A row that neither can name is left untouched (the loader hides fully blank rows).
//
// Used by `generate-catalog-data.mjs` (right after each builder, so a regeneration keeps
// the names) and by `complete-catalog.mjs` (patches the committed catalog without the CSVs).
// Idempotent: a completed product has a name (and a colour) and is not changed again.

import { existsSync, readFileSync } from 'node:fs';
import { buildEntryId, buildProductSlug } from './supplier-csv.ts';

export function readProductOverrides(path) {
	if (!existsSync(path)) return {};
	const raw = JSON.parse(readFileSync(path, 'utf-8'));
	return Object.fromEntries(Object.entries(raw).filter(([key]) => !key.startsWith('_')));
}

const isBlank = (value) => !value || !String(value).trim();

/** Portwest SKUs are `<styleCode><3-char colour code><size>` (e.g. FT45BKR37 → BKR). */
function portwestColourCode(product) {
	const sku = product.sourceSkus?.[0];
	if (!sku || !sku.startsWith(product.styleCode)) return null;
	const code = sku.slice(product.styleCode.length, product.styleCode.length + 3);
	return code.length === 3 ? code : null;
}

/** colour code → most frequent colour name among the named products of the catalog. */
function buildColourTable(products) {
	const counts = new Map();
	for (const product of products) {
		if (isBlank(product.name) || isBlank(product.colour)) continue;
		const code = portwestColourCode(product);
		if (!code) continue;
		const byName = counts.get(code) ?? new Map();
		byName.set(product.colour, (byName.get(product.colour) ?? 0) + 1);
		counts.set(code, byName);
	}
	const table = new Map();
	for (const [code, byName] of counts) {
		table.set(code, [...byName].sort((a, b) => b[1] - a[1])[0][0]);
	}
	return table;
}

// Same ranking as src/utils/sizes.ts: letter sizes in garment order, then numeric sizes.
// prettier-ignore
const ALPHA_ORDER = ['4XS', 'XXXXS', '3XS', 'XXXS', '2XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'XXXXL', '4XL', '5XL', '6XL', '7XL', '8XL'];

function sizeRank(size) {
	const alpha = ALPHA_ORDER.indexOf(size.trim().toUpperCase());
	if (alpha >= 0) return alpha;
	const numeric = size.match(/\d+(?:[.,]\d+)?/);
	return numeric ? 100 + Number.parseFloat(numeric[0].replace(',', '.')) : 10_000;
}

function mergeSizes(target, extra) {
	const merged = [...new Set([...target, ...extra])];
	return merged.sort((a, b) => sizeRank(a) - sizeRank(b));
}

/**
 * Completes the products in place (and drops the rows merged into an existing colourway).
 * Returns the new product array and a report.
 */
export function completeProducts(supplier, products, overrides = {}) {
	const colourTable = supplier === 'portwest' ? buildColourTable(products) : new Map();
	// Codes the catalog never names but an override does (e.g. AQR → Aqua) apply to every
	// model, so a single pass gives the same result as repeated runs.
	for (const { colours } of Object.values(overrides)) {
		for (const [code, name] of Object.entries(colours ?? {})) {
			if (!colourTable.has(code)) colourTable.set(code, name);
		}
	}
	const byId = new Map(products.map((product) => [product.id, product]));
	const styleCodes = new Set(products.map((product) => product.styleCode));
	const merged = new Set();
	const report = {
		named: 0,
		coloured: 0,
		merged: 0,
		unknownColourCodes: [],
		unmatchedOverrides: Object.keys(overrides).filter((styleCode) => !styleCodes.has(styleCode)),
	};

	for (const product of products) {
		const needsName = isBlank(product.name);
		const needsColour = supplier === 'portwest' && isBlank(product.colour);
		if (!needsName && !needsColour) continue;
		const override = overrides[product.styleCode];

		if (needsName) {
			const sibling = products.find(
				(other) => other !== product && other.styleCode === product.styleCode && !isBlank(other.name),
			);
			const source = override?.name ? override : sibling;
			if (!source) continue;
			product.name = source.name.trim();
			if (isBlank(product.description) && !isBlank(source.description)) {
				product.description = source.description.trim();
			}
		}

		if (needsColour) {
			// Colour code → name: the override's `colours` map, then the same code on a named
			// colourway of the model, then the most frequent name for that code in the catalog.
			const code = portwestColourCode(product);
			const sameCode = products.find(
				(other) =>
					other !== product &&
					other.styleCode === product.styleCode &&
					!isBlank(other.colour) &&
					portwestColourCode(other) === code,
			);
			const colour = override?.colours?.[code] ?? sameCode?.colour ?? (code ? colourTable.get(code) : undefined);
			if (colour) {
				product.colour = colour;
			} else {
				report.unknownColourCodes.push(`${product.styleCode}${code ?? ''}`);
				if (!needsName) continue;
			}
		}

		// Rebuild id/slug the way the builders do. Their key is the middle part of the id:
		// the style code (Portwest), produit-qualité-coloris (Mascot) or base ref (Blaklader).
		const colour = product.colour.trim();
		const entryKey = product.id.split(':')[1];
		const id = buildEntryId(supplier, entryKey, colour);
		const existing = byId.get(id);
		if (existing && existing !== product) {
			existing.sizes = mergeSizes(existing.sizes ?? [], product.sizes ?? []);
			existing.sourceSkus = [...new Set([...(existing.sourceSkus ?? []), ...(product.sourceSkus ?? [])])];
			merged.add(product);
			report.merged++;
			continue;
		}
		byId.delete(product.id);
		product.id = id;
		product.slug = buildProductSlug(product.name, colour, entryKey);
		byId.set(id, product);
		if (needsName) report.named++;
		else report.coloured++;
	}

	return { products: products.filter((product) => !merged.has(product)), report };
}
