import type { APIRoute } from 'astro';
import { buildCatalogSearchIndex } from '~/utils/catalog-search-index';

export const GET: APIRoute = async () => {
	return new Response(JSON.stringify(await buildCatalogSearchIndex('fr')), {
		headers: { 'Content-Type': 'application/json' },
	});
};
