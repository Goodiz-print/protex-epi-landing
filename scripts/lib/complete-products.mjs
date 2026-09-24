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
// It also fixes named products: an override `name` / `description` / `colours` entry always
// wins (translations, typos), and every product's text is normalised (whitespace runs,
// truncated Portwest colour suffixes such as « Orange/Noir Shor »).
// Idempotent: a second run changes nothing.

import { existsSync, readFileSync } from 'node:fs';
import { buildEntryId, buildProductSlug } from './supplier-csv.ts';
import { slugify } from '../../src/utils/slugify.ts';

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

// Colour labels the Portwest export garbles, whatever the model.
const COLOUR_FIXES = { 'Navy NV S': 'Marine Short' };

const decodeEntities = (value) => value.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&');

/**
 * `&nbsp;` decoded, whitespace runs collapsed, ends trimmed; Portwest colour labels fixed
 * (suffix truncated by the export: « Orange/Noir Shor » → « Orange/Noir Short »).
 */
function normaliseText(product) {
	const name = decodeEntities(product.name).replace(/\s+/g, ' ').trim();
	let colour = decodeEntities(product.colour)
		.replace(/\s+/g, ' ')
		.trim()
		.replace(/ (?:Shor|Sho|Sh)$/, ' Short');
	colour = COLOUR_FIXES[colour] ?? colour;
	const description = decodeEntities(product.description).replace(/[ \t]{2,}/g, ' ').trim();
	const changed = name !== product.name || colour !== product.colour || description !== product.description;
	Object.assign(product, { name, colour, description });
	return changed;
}

/**
 * Completes and fixes the products in place (and drops the rows merged into an existing
 * colourway). Returns the new product array and a report. Three passes so the result does
 * not depend on product order: (1) normalise + apply overrides, (2) fill the blanks from
 * sibling colourways and the colour table, (3) rebuild id/slug of every changed product.
 */
export function completeProducts(supplier, products, overrides = {}) {
	const styleCodes = new Set(products.map((product) => product.styleCode));
	const report = {
		named: 0,
		renamed: 0,
		coloured: 0,
		normalised: 0,
		merged: 0,
		unknownColourCodes: [],
		unmatchedOverrides: Object.keys(overrides).filter((styleCode) => !styleCodes.has(styleCode)),
	};
	const original = new Map(products.map((product) => [product, { name: product.name, colour: product.colour }]));
	const wasBlank = new Set(products.filter((product) => isBlank(product.name)));

	// 1. Normalisation, then the overrides, which always win over the export.
	for (const product of products) {
		if (normaliseText(product)) report.normalised++;
		const override = overrides[product.styleCode];
		if (!override) continue;
		if (override.name) product.name = override.name.trim();
		if (override.description) product.description = override.description.trim();
		const code = supplier === 'portwest' ? portwestColourCode(product) : null;
		const colour = code ? override.colours?.[code] : undefined;
		if (colour) product.colour = colour;
	}

	// 2. Blanks: name/description from a named colourway of the model; Portwest colour from
	//    the same code on the model, else the most frequent name for that code in the catalog
	//    (override `colours` included for codes the catalog never names).
	const colourTable = supplier === 'portwest' ? buildColourTable(products) : new Map();
	for (const { colours } of Object.values(overrides)) {
		for (const [code, name] of Object.entries(colours ?? {})) {
			if (!colourTable.has(code)) colourTable.set(code, name);
		}
	}
	for (const product of products) {
		if (isBlank(product.name)) {
			const sibling = products.find(
				(other) => other !== product && other.styleCode === product.styleCode && !isBlank(other.name),
			);
			if (!sibling) continue;
			product.name = sibling.name;
			if (isBlank(product.description)) product.description = sibling.description;
		}
		if (supplier === 'portwest' && isBlank(product.colour)) {
			const code = portwestColourCode(product);
			const sameCode = products.find(
				(other) =>
					other !== product &&
					other.styleCode === product.styleCode &&
					!isBlank(other.colour) &&
					portwestColourCode(other) === code,
			);
			const colour = sameCode?.colour ?? (code ? colourTable.get(code) : undefined);
			if (colour) product.colour = colour;
			else report.unknownColourCodes.push(`${product.styleCode}${code ?? ''}`);
		}
	}

	// 3. Rebuild id/slug the way the builders do. Their key is the middle part of the id:
	//    the style code (Portwest), produit-qualité-coloris (Mascot) or base ref (Blaklader).
	//    A colourway whose new id already exists is merged into it.
	const byId = new Map(products.map((product) => [product.id, product]));
	const merged = new Set();
	for (const product of products) {
		const before = original.get(product);
		// Compared by slug form: a whitespace-only fix does not change the URL.
		const nameChanged = slugify(product.name) !== slugify(before.name);
		const colourChanged = slugify(product.colour) !== slugify(before.colour);
		if (!nameChanged && !colourChanged && !wasBlank.has(product)) continue;
		if (isBlank(product.name)) continue;

		const colour = product.colour.trim();
		const entryKey = product.id.split(':')[1];
		const id = buildEntryId(supplier, entryKey, colour);
		const existing = byId.get(id);
		if (existing && existing !== product && !merged.has(existing)) {
			existing.sizes = mergeSizes(existing.sizes ?? [], product.sizes ?? []);
			existing.sourceSkus = [...new Set([...(existing.sourceSkus ?? []), ...(product.sourceSkus ?? [])])];
			merged.add(product);
			report.merged++;
			continue;
		}
		const slug = buildProductSlug(product.name, colour, entryKey);
		if (id === product.id && slug === product.slug) continue;
		byId.delete(product.id);
		product.id = id;
		product.slug = slug;
		byId.set(id, product);
		if (wasBlank.has(product)) report.named++;
		else if (nameChanged) report.renamed++;
		else report.coloured++;
	}

	return { products: products.filter((product) => !merged.has(product)), report };
}
