import type { ImageMetadata } from 'astro';
import { getCollectivitesUrl, getSelectionUrl, getSubcategoryUrl, type Lang } from '~/utils/catalog';
import hiVisImage from '~/assets/images/veste-haute-visbilite.png';
import masquesImage from '~/assets/images/tiles/masques.jpg';
import summerImage from '~/assets/images/tiles/summer.jpg';
import winterImage from '~/assets/images/tiles/winter-1.jpg';
import collectivitesImage from '~/assets/images/tiles/collectivites.jpg';

// Grandes tuiles thématiques en bas de page d'accueil (bloc de 6 demandé par
// le client, septembre 2026). Chaque tuile porte son visuel dédié ; la tuile
// vidéo joue le film Portwest en lite-embed (clic → iframe youtube-nocookie).
export interface ThematicTile {
	id: string;
	labels: Record<Lang, string>;
	image?: ImageMetadata;
	imagePositionClass?: string;
	/** Pas de voile sombre (photo produit sur fond clair, demande client). */
	noScrim?: boolean;
	/** Remplace object-cover, ex. `object-contain bg-white` pour ne rien rogner. */
	fitClass?: string;
	video?: { youtubeId: string; start?: number };
	getHref?: (lang: Lang) => string;
}

export const thematicTiles: ThematicTile[] = [
	{
		id: 'vestes-haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'High-visibility jackets' },
		image: hiVisImage,
		// Photo claire : bandeau brand plutôt qu’un voile sombre.
		// object-left : le modèle est à gauche du 2:1, object-cover recadre le mur.
		noScrim: true,
		imagePositionClass: 'object-left',
		getHref: (lang) => getSelectionUrl(lang, 'vestes-haute-visibilite'),
	},
	{
		id: 'masques',
		labels: { fr: 'Masques', en: 'Masks' },
		image: masquesImage,
		getHref: (lang) => getSubcategoryUrl(lang, 'tete', 'protection-respiratoire'),
	},
	{
		id: 'ete',
		labels: { fr: 'Été', en: 'Summer' },
		image: summerImage,
		getHref: (lang) => getSelectionUrl(lang, 'ete'),
	},
	{
		id: 'collectivites',
		labels: { fr: 'Collectivités', en: 'Local authorities' },
		image: collectivitesImage,
		getHref: (lang) => getCollectivitesUrl(lang),
	},
	{
		id: 'video-portwest',
		labels: { fr: 'La vidéo Portwest', en: 'Portwest company video' },
		video: { youtubeId: 'WAkl88qoO38', start: 22 },
	},
	{
		id: 'hiver',
		labels: { fr: 'Hiver', en: 'Winter' },
		image: winterImage,
		getHref: (lang) => getSelectionUrl(lang, 'hiver'),
	},
];
