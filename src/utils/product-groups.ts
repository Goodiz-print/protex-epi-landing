import type { Product } from '~/content/schemas/product';

// One group = one style (model), aggregating its colourway products.
// Mirrors the reference site, which shows one listing card per model
// with colour swatches, while each colourway keeps its own product page.
export interface ProductGroup {
	key: string;
	/** Model name without the colour suffix when the colourways share one. */
	displayName: string;
	primary: Product;
	colourways: Product[];
	priceMin: number;
	priceMax: number;
	sizes: string[];
}

// Blaklader article numbers are <model:4><fabric:4><colour:4>; the same
// garment in another colour gets a different styleCode, so the style key
// only keeps the model+fabric part. Portwest and Mascot styleCodes are
// already colour-independent.
export function styleKey(product: Product): string {
	if (product.supplier === 'blaklader' && /^\d{12}$/.test(product.styleCode)) {
		return `blaklader:${product.styleCode.slice(0, 8)}`;
	}
	return `${product.supplier}:${product.styleCode}`;
}

function displayName(group: ProductGroup): string {
	if (group.colourways.length < 2) return group.primary.name;
	const { name, colour } = group.primary;
	if (colour && name.toLowerCase().endsWith(colour.toLowerCase())) {
		return name.slice(0, name.length - colour.length).replace(/[\s,/-]+$/, '');
	}
	return name;
}

export function groupProductsByStyle(products: Product[]): ProductGroup[] {
	const groups = new Map<string, ProductGroup>();
	for (const product of products) {
		const key = styleKey(product);
		const group = groups.get(key);
		if (!group) {
			groups.set(key, {
				key,
				displayName: product.name,
				primary: product,
				colourways: [product],
				priceMin: product.price,
				priceMax: product.price,
				sizes: [...product.sizes],
			});
		} else {
			group.colourways.push(product);
			group.priceMin = Math.min(group.priceMin, product.price);
			group.priceMax = Math.max(group.priceMax, product.price);
			for (const size of product.sizes) {
				if (!group.sizes.includes(size)) group.sizes.push(size);
			}
		}
	}
	const result = [...groups.values()];
	for (const group of result) {
		group.displayName = displayName(group);
	}
	return result;
}
