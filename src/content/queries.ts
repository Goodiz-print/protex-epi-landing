import { getCollection } from 'astro:content';
import { categoryTaxonomy, type Category, type Subcategory } from '~/data/category-taxonomy';
import { garmentTypes, type GarmentType } from '~/data/garment-types';
import { collectiviteSections, matchesSelection, selections, type Selection } from '~/data/selections';
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
			return garmentType.keywords.some((keyword) => name.includes(keyword));
		})
		.map((entry) => entry.data);
}

export async function getProductsBySelection(selection: Selection) {
	const products = await getAllProducts();
	let matched = products.filter((entry) => matchesSelection(selection, entry.data)).map((entry) => entry.data);
	if (selection.limit) {
		// Le plafond s'applique en nombre de modèles : on garde tous les coloris
		// des `limit` premiers groupes pour ne pas tronquer les pastilles.
		const kept = new Set(
			groupProductsByStyle(matched)
				.slice(0, selection.limit)
				.map((group) => group.key),
		);
		matched = matched.filter((product) => kept.has(styleKey(product)));
	}
	return matched;
}

export async function getProductsBySubcategory(categorySlug: string, subcategorySlug: string) {
	const products = await getAllProducts();
	return products
		.filter((entry) => entry.data.category === categorySlug && entry.data.subcategory === subcategorySlug)
		.map((entry) => entry.data);
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

export interface SelectionStaticPath {
	params: { selection: string };
	props: { selection: Selection };
}

export function getSelectionStaticPaths(): SelectionStaticPath[] {
	return selections.map((selection) => ({
		params: { selection: selection.slug },
		props: { selection },
	}));
}

export interface CollectiviteSectionStaticPath {
	params: { section: string };
	props: { selection: Selection };
}

export function getCollectiviteSectionStaticPaths(): CollectiviteSectionStaticPath[] {
	return collectiviteSections.map((selection) => ({
		params: { section: selection.slug },
		props: { selection },
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
