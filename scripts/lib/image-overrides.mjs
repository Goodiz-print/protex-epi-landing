// Manual product image overrides — `src/data/image-overrides.<supplier>.json`, keyed by
// product id (`<supplier>:<styleCode>:<colour-slug>`, the `id` field of the catalog JSON)
// with a full image URL as value. Used both by `generate-catalog-data.mjs` (so a
// regeneration keeps the fixes) and by `apply-image-overrides.mjs` (patches the committed
// catalog JSON without the supplier CSVs).

import { existsSync, readFileSync } from 'node:fs';

export function readImageOverrides(path) {
	if (!existsSync(path)) return {};
	const raw = JSON.parse(readFileSync(path, 'utf-8'));
	return Object.fromEntries(Object.entries(raw).filter(([key]) => !key.startsWith('_')));
}

/**
 * Applies the overrides in place. Returns the ids of the overrides that matched no product
 * so the caller can warn about typos.
 */
export function applyImageOverrides(products, overrides) {
	const unknown = new Set(Object.keys(overrides));
	let changed = 0;
	for (const product of products) {
		const imageUrl = overrides[product.id];
		if (!imageUrl) continue;
		unknown.delete(product.id);
		if (product.imageUrl === imageUrl) continue;
		product.imageUrl = imageUrl;
		changed++;
	}
	return { changed, unknown: [...unknown] };
}
