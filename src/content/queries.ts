import { getCollection } from 'astro:content';
import { categoryTaxonomy, type Category, type Subcategory } from '~/data/category-taxonomy';
import { garmentTypes, type GarmentType } from '~/data/garment-types';

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

export async function getProductsBySubcategory(categorySlug: string, subcategorySlug: string) {
	const products = await getAllProducts();
	return products
		.filter((entry) => entry.data.category === categorySlug && entry.data.subcategory === subcategorySlug)
		.map((entry) => entry.data);
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
