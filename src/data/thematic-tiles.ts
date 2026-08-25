import type { ImageMetadata } from 'astro';
import { getGarmentTypeUrl, getSubcategoryUrl, type Lang } from '~/utils/catalog';
import hiVisImage from '~/assets/images/veste-haute-visbilite.png';

// Large themed tiles at the bottom of the homepage (mirrors the reference
// site's "univers" strip, but every tile points to a real catalog page).
// Dedicated visuals can be dropped in src/assets/images/tiles/ and wired
// up here; tiles without an `image` fall back to a product photo of their
// destination at build time (see ThematicTiles.astro).
export interface ThematicTile {
	id: string;
	labels: Record<Lang, string>;
	image?: ImageMetadata;
	imagePositionClass?: string;
	/** Products of this subcategory feed the image fallback. */
	subcategory?: { category: string; subcategory: string };
	/** Products of this garment type feed the image fallback. */
	garmentType?: string;
	getHref: (lang: Lang) => string;
}

export const thematicTiles: ThematicTile[] = [
	{
		id: 'haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'High-visibility jackets' },
		image: hiVisImage,
		imagePositionClass: 'object-top',
		getHref: (lang) => getSubcategoryUrl(lang, 'corps', 'vetements-haute-visibilite'),
	},
	{
		id: 'pluie',
		labels: { fr: 'Vêtements de pluie', en: 'Rainwear' },
		subcategory: { category: 'corps', subcategory: 'vetements-pluie' },
		getHref: (lang) => getSubcategoryUrl(lang, 'corps', 'vetements-pluie'),
	},
	{
		id: 'ete',
		labels: { fr: 'Été', en: 'Summer' },
		garmentType: 't-shirts',
		getHref: (lang) => getGarmentTypeUrl(lang, 't-shirts'),
	},
	{
		id: 'hiver',
		labels: { fr: 'Hiver', en: 'Winter' },
		garmentType: 'vestes-sweats',
		getHref: (lang) => getGarmentTypeUrl(lang, 'vestes-sweats'),
	},
];
