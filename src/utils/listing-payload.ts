import type { Product } from '~/content/schemas/product';
import { getProductUrl, type Lang } from '~/utils/catalog';
import { useTranslations } from '~/i18n/utils';
import { formatPriceRange } from '~/utils/format';
import { formatSizeRange } from '~/utils/sizes';
import { groupProductsByStyle, type ProductGroup } from '~/utils/product-groups';

export const LISTING_PAGE_SIZE = 24;
export const MAX_SWATCHES = 5;

// Entrée compacte du payload de listing, servie en JSON statique par les
// endpoints listing.json et consommée par le script client de ProductGrid.
export interface ListingCardData {
	/** Titre affiché (nom du modèle). */
	t: string;
	/** URL de la page produit du coloris principal. */
	h: string;
	/** URL de l'image principale (CDN fournisseur). */
	img: string;
	/** Prix minimal positif pour le tri — null si aucun prix exploitable. */
	p: number | null;
	/** Libellé de prix prêt à afficher (plage, ou « prix sur demande »). */
	pl: string;
	/** Fournisseur (filtre). */
	s: string;
	/** Plage de tailles prête à afficher. */
	sz: string | null;
	/** Pastilles coloris : lien + libellé (le rendu couleur est dérivé de `c`). */
	cw: { h: string; c: string }[];
	/** Nombre de coloris au-delà des pastilles affichées. */
	cx: number;
}

export function groupPriceLabel(group: ProductGroup, lang: Lang): string {
	const t = useTranslations(lang);
	return group.priceMax > 0 ? formatPriceRange(group.priceMin, group.priceMax, lang) : t('catalog.priceOnRequest');
}

export function buildListingPayload(products: Product[], lang: Lang): ListingCardData[] {
	return groupProductsByStyle(products).map((group) => ({
		t: group.displayName,
		h: getProductUrl(lang, group.primary.category, group.primary.subcategory, group.primary.slug),
		img: group.primary.imageUrl,
		p: group.priceMax > 0 ? group.priceMin : null,
		pl: groupPriceLabel(group, lang),
		s: group.primary.supplier,
		sz: formatSizeRange(group.sizes),
		cw:
			group.colourways.length > 1
				? group.colourways.slice(0, MAX_SWATCHES).map((colourway) => ({
						h: getProductUrl(lang, colourway.category, colourway.subcategory, colourway.slug),
						c: colourway.colour,
					}))
				: [],
		cx: Math.max(0, group.colourways.length - MAX_SWATCHES),
	}));
}
