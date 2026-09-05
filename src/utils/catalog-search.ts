export interface CatalogSearchEntry {
	/** Titre affiché. */
	t: string;
	/** URL de la page produit. */
	u: string;
	/** Image principale. */
	i: string;
	/** Libellé de prix. */
	p: string;
	/** Haystack minuscule (nom, SKU, coloris, description). */
	k: string;
}

export interface PagefindResultData {
	url: string;
	excerpt: string;
	meta?: { title?: string; image?: string; price?: string };
}

export interface PagefindApi {
	search(query: string): Promise<{ results: { data(): Promise<PagefindResultData> }[] }>;
}

export function filterCatalogIndex(entries: CatalogSearchEntry[], query: string): CatalogSearchEntry[] {
	const tokens = query
		.toLowerCase()
		.split(/\s+/)
		.filter((token) => token.length > 0);
	if (tokens.length === 0) return [];
	return entries.filter((entry) => tokens.every((token) => entry.k.includes(token)));
}

export function entryToPagefindData(entry: CatalogSearchEntry): PagefindResultData {
	return {
		url: entry.u,
		excerpt: entry.t,
		meta: { title: entry.t, image: entry.i, price: entry.p },
	};
}

export async function createCatalogSearch(indexUrl: string): Promise<PagefindApi> {
	const response = await fetch(indexUrl);
	if (!response.ok) throw new Error(`search index HTTP ${response.status}`);
	const entries = (await response.json()) as CatalogSearchEntry[];
	return {
		async search(query: string) {
			const hits = filterCatalogIndex(entries, query);
			return {
				results: hits.map((entry) => ({
					data: async () => entryToPagefindData(entry),
				})),
			};
		},
	};
}

/**
 * Pagefind is generated after `astro build` (`pagefind --site dist`), so the
 * module is missing in `astro dev` and absent from Vite's graph. A static
 * `import('/pagefind/pagefind.js')` leaves an unresolved `__VITE_PRELOAD__`
 * token in production (see commit 9a22212); `new Function` hides it from
 * Rollup. When the import fails, fall back to the catalog JSON index.
 */
export async function loadSearchEngine(indexUrl: string): Promise<PagefindApi> {
	const dynamicImport = new Function('path', 'return import(path)') as (path: string) => Promise<PagefindApi>;
	try {
		return await dynamicImport('/pagefind/pagefind.js');
	} catch {
		return createCatalogSearch(indexUrl);
	}
}
