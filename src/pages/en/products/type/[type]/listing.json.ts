import type { APIRoute } from 'astro';
import type { GarmentType } from '~/data/garment-types';
import { getGarmentTypeStaticPaths, getProductsByGarmentType } from '~/content/queries';
import { buildListingPayload } from '~/utils/listing-payload';

export function getStaticPaths() {
	return getGarmentTypeStaticPaths();
}

export const GET: APIRoute = async ({ props }) => {
	const { garmentType } = props as { garmentType: GarmentType };
	const products = await getProductsByGarmentType(garmentType);
	return new Response(JSON.stringify(buildListingPayload(products, 'en')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
