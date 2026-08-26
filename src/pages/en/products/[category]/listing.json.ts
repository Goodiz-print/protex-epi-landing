import type { APIRoute } from 'astro';
import type { Category } from '~/data/category-taxonomy';
import { getCategoryStaticPaths, getProductsByCategory } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export function getStaticPaths() {
	return getCategoryStaticPaths();
}

export const GET: APIRoute = async ({ props }) => {
	const { category } = props as { category: Category };
	const products = await getProductsByCategory(category.slug);
	return new Response(JSON.stringify(buildListingPayload(products, 'en')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
