import { getAllProducts } from '~/content/queries';
import { getProductUrl, type Lang } from '~/utils/catalog';
import { groupPriceLabel } from '~/utils/listing-payload';
import { groupProductsByStyle } from '~/utils/product-groups';
import type { CatalogSearchEntry } from '~/utils/catalog-search';

export async function buildCatalogSearchIndex(lang: Lang): Promise<CatalogSearchEntry[]> {
	const products = (await getAllProducts())
		.map((entry) => entry.data)
		.filter((product) => product.category !== 'a-trier');

	return groupProductsByStyle(products).map((group) => {
		const title = group.displayName;
		const colours = group.colourways.map((colourway) => colourway.colour).join(' ');
		return {
			t: title,
			u: getProductUrl(lang, group.primary.category, group.primary.subcategory, group.primary.slug),
			i: group.primary.imageUrl,
			p: groupPriceLabel(group, lang),
			k: `${title} ${group.primary.styleCode} ${colours} ${group.primary.description}`.toLowerCase(),
		};
	});
}
