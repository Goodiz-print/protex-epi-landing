import type { APIRoute } from 'astro';
import { getMixedProducts } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export const GET: APIRoute = async () => {
	const products = await getMixedProducts();
	return new Response(JSON.stringify(buildListingPayload(products, 'fr')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
