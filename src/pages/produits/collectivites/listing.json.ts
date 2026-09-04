import type { APIRoute } from 'astro';
import { getCollectivitesProducts } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export const GET: APIRoute = async () => {
	const products = await getCollectivitesProducts();
	return new Response(JSON.stringify(buildListingPayload(products, 'fr')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
