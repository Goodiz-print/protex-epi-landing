import { getCollection } from 'astro:content';
import { categoryTaxonomy, type Category, type Subcategory } from '~/data/category-taxonomy';
import { garmentTypes, type GarmentType } from '~/data/garment-types';
import type { Product } from '~/content/schemas/product';
import { groupProductsByStyle, styleKey, type ProductGroup } from '~/utils/product-groups';

export async function getAllProducts() {
	return getCollection('products');
}

export async function getProductsByCategory(categorySlug: string) {
	const products = await getAllProducts();
	return products.filter((entry) => entry.data.category === categorySlug).map((entry) => entry.data);
}

export async function getProductsByGarmentType(garmentType: GarmentType) {
	const products = await getAllProducts();
	return products
		.filter((entry) => entry.data.category !== 'a-trier')
		.filter((entry) => {
			const name = entry.data.name.toLowerCase();
			const matches = garmentType.rules.some(
				(rule) =>
					(!rule.category || entry.data.category === rule.category) &&
					(!rule.subcategory || entry.data.subcategory === rule.subcategory) &&
					(!rule.keywords || rule.keywords.some((keyword) => name.includes(keyword))),
			);
			return matches && !garmentType.exclude?.some((keyword) => name.includes(keyword));
		})
		.map((entry) => entry.data);
}

export async function getProductsBySubcategory(categorySlug: string, subcategorySlug: string) {
	const products = await getAllProducts();
	return products
		.filter((entry) => entry.data.category === categorySlug && entry.data.subcategory === subcategorySlug)
		.map((entry) => entry.data);
}

/**
 * « Méli-mélo » : l'entièreté du catalogue (hors « à trier »), mélangée de
 * façon déterministe pour brasser fournisseurs et univers plutôt que de
 * servir tout Portwest, puis tout Blaklader, etc.
 */
export async function getMixedProducts() {
	const products = await getAllProducts();
	const pool = products.filter((entry) => entry.data.category !== 'a-trier').map((entry) => entry.data);
	// Fisher-Yates avec un PRNG à graine fixe : ordre stable d'un build à l'autre.
	let seed = 0x9e3779b9;
	const random = () => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 0x100000000;
	};
	for (let i = pool.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[pool[i], pool[j]] = [pool[j], pool[i]];
	}
	return pool;
}

/** Produits de la sélection « Collectivités », dans l'ordre de la sélection. */
export async function getCollectivitesProducts() {
	const { collectivitesSelection } = await import('~/data/collectivites');
	const rank = new Map(collectivitesSelection.map((style, index) => [`${style.supplier}|${style.styleCode}`, index]));
	const products = await getAllProducts();
	return products
		.map((entry) => entry.data)
		.filter((product) => rank.has(`${product.supplier}|${product.styleCode}`))
		.sort(
			(a, b) =>
				(rank.get(`${a.supplier}|${a.styleCode}`) ?? 0) - (rank.get(`${b.supplier}|${b.styleCode}`) ?? 0),
		);
}

// These two run once per product page (6 000+ at build time), so everything
// is derived from indexes built a single time and memoized at module level.
let colourwaysIndexPromise: Promise<Map<string, Product[]>> | null = null;
function getColourwaysIndex(): Promise<Map<string, Product[]>> {
	colourwaysIndexPromise ??= getAllProducts().then((products) => {
		const index = new Map<string, Product[]>();
		for (const entry of products) {
			const key = styleKey(entry.data);
			const bucket = index.get(key);
			if (bucket) bucket.push(entry.data);
			else index.set(key, [entry.data]);
		}
		return index;
	});
	return colourwaysIndexPromise;
}

let scopedGroupsPromise: Promise<Map<string, ProductGroup[]>> | null = null;
function getScopedGroups(): Promise<Map<string, ProductGroup[]>> {
	scopedGroupsPromise ??= getAllProducts().then((products) => {
		const pools = new Map<string, Product[]>();
		for (const entry of products) {
			const scope = `${entry.data.category}|${entry.data.subcategory ?? ''}`;
			const pool = pools.get(scope);
			if (pool) pool.push(entry.data);
			else pools.set(scope, [entry.data]);
		}
		return new Map([...pools].map(([scope, pool]) => [scope, groupProductsByStyle(pool)]));
	});
	return scopedGroupsPromise;
}

/** All colourways of the same style (model), current product included. */
export async function getColourwaysByStyle(product: Product): Promise<Product[]> {
	const index = await getColourwaysIndex();
	return index.get(styleKey(product)) ?? [product];
}

/** Other styles from the same subcategory, one group per style. */
export async function getSimilarProducts(product: Product, limit = 4): Promise<ProductGroup[]> {
	const groups = await getScopedGroups();
	const scoped = groups.get(`${product.category}|${product.subcategory ?? ''}`) ?? [];
	const key = styleKey(product);
	return scoped.filter((group) => group.key !== key).slice(0, limit);
}

export interface GarmentTypeStaticPath {
	params: { type: string };
	props: { garmentType: GarmentType };
}

export function getGarmentTypeStaticPaths(): GarmentTypeStaticPath[] {
	return garmentTypes.map((garmentType) => ({
		params: { type: garmentType.slug },
		props: { garmentType },
	}));
}

export interface CategoryStaticPath {
	params: { category: string };
	props: { category: Category };
}

export function getCategoryStaticPaths(): CategoryStaticPath[] {
	return categoryTaxonomy.map((category) => ({
		params: { category: category.slug },
		props: { category },
	}));
}

export interface SubcategoryStaticPath {
	params: { category: string; subcategory: string };
	props: { category: Category; subcategory: Subcategory };
}

export function getSubcategoryStaticPaths(): SubcategoryStaticPath[] {
	return categoryTaxonomy.flatMap((category) =>
		category.subcategories.map((subcategory) => ({
			params: { category: category.slug, subcategory: subcategory.slug },
			props: { category, subcategory },
		})),
	);
}

export async function getProductStaticPaths() {
	const products = await getAllProducts();
	return products.map((entry) => ({
		params: {
			category: entry.data.category,
			subcategory: entry.data.subcategory ?? '_',
			slug: entry.data.slug,
		},
		props: { product: entry.data },
	}));
}
