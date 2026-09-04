import type { ImageMetadata } from 'astro';
import {
	getCollectivitesUrl,
	getGarmentTypeUrl,
	getSubcategoryUrl,
	type Lang,
} from '~/utils/catalog';
import hiVisImage from '~/assets/images/veste-haute-visbilite.png';
import collectivitesImage from '~/assets/images/visuel-collectivites.png';

// Large themed tiles at the bottom of the homepage. Dedicated visuals can be
// dropped in src/assets/images/ and wired up here; tiles without an `image`
// fall back to a product photo of their destination at build time (see
// ThematicTiles.astro).
export interface ThematicTile {
	id: string;
	labels: Record<Lang, string>;
	image?: ImageMetadata;
	imagePositionClass?: string;
	/** Affiche l'image entière (object-contain sur fond blanc), sans la rogner. */
	contain?: boolean;
	/** Pas de voile sombre par-dessus l'image. */
	noOverlay?: boolean;
	/** N'affiche pas le libellé (visuel auto-porteur) — gardé pour l'accessibilité. */
	hideLabel?: boolean;
	/** Products of this subcategory feed the image fallback. */
	subcategory?: { category: string; subcategory: string };
	/** Products of this garment type feed the image fallback. */
	garmentType?: string;
	/** Tuile vidéo (YouTube) à la place d'un lien. */
	video?: { youtubeId: string; start?: number };
	getHref?: (lang: Lang) => string;
}

export const thematicTiles: ThematicTile[] = [
	{
		id: 'vestes-haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'High-visibility jackets' },
		image: hiVisImage,
		contain: true,
		noOverlay: true,
		getHref: (lang) => getGarmentTypeUrl(lang, 'vestes-haute-visibilite'),
	},
	{
		id: 'masques',
		labels: { fr: 'Masques', en: 'Masks' },
		subcategory: { category: 'tete', subcategory: 'protection-respiratoire' },
		getHref: (lang) => getSubcategoryUrl(lang, 'tete', 'protection-respiratoire'),
	},
	{
		id: 'ete',
		labels: { fr: 'Été', en: 'Summer' },
		garmentType: 'ete',
		getHref: (lang) => getGarmentTypeUrl(lang, 'ete'),
	},
	{
		id: 'collectivites',
		labels: { fr: 'Collectivités', en: 'Public sector' },
		image: collectivitesImage,
		noOverlay: true,
		hideLabel: true,
		getHref: (lang) => getCollectivitesUrl(lang),
	},
	{
		id: 'video-portwest',
		labels: { fr: 'Vidéo Portwest', en: 'Portwest video' },
		video: { youtubeId: 'WAkl88qoO38', start: 22 },
	},
	{
		id: 'hiver',
		labels: { fr: 'Hiver', en: 'Winter' },
		garmentType: 'hiver',
		getHref: (lang) => getGarmentTypeUrl(lang, 'hiver'),
	},
];
