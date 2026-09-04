import type { APIRoute } from 'astro';
import type { Selection } from '~/data/selections';
import { getCollectiviteSectionStaticPaths, getProductsBySelection } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export function getStaticPaths() {
	return getCollectiviteSectionStaticPaths();
}

export const GET: APIRoute = async ({ props }) => {
	const { selection } = props as { selection: Selection };
	const products = await getProductsBySelection(selection);
	return new Response(JSON.stringify(buildListingPayload(products, 'en')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
