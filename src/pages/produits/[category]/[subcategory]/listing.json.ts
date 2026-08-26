import type { APIRoute } from 'astro';
import type { Category, Subcategory } from '~/data/category-taxonomy';
import { getSubcategoryStaticPaths, getProductsBySubcategory } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export function getStaticPaths() {
	return getSubcategoryStaticPaths();
}

export const GET: APIRoute = async ({ props }) => {
	const { category, subcategory } = props as { category: Category; subcategory: Subcategory };
	const products = await getProductsBySubcategory(category.slug, subcategory.slug);
	return new Response(JSON.stringify(buildListingPayload(products, 'fr')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
