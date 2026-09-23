import type { ImageMetadata } from 'astro';
import { getCollectivitesUrl, getSelectionUrl, getSubcategoryUrl, type Lang } from '~/utils/catalog';
import hiVisImage from '~/assets/images/veste-haute-visbilite.png';
import masquesImage from '~/assets/images/tiles/masques.jpg';
import summerImage from '~/assets/images/tiles/summer.jpg';
import winterImage from '~/assets/images/tiles/winter-1.jpg';
import collectivitesLogo from '~/assets/images/nav/collectivites-logo.png';

// Grandes tuiles thématiques en bas de page d'accueil (bloc de 6 demandé par
// le client, septembre 2026). Chaque tuile porte son visuel dédié, sans voile
// sombre ni bandeau (retour client) ; le libellé est posé en blanc ombré sur la
// photo. La tuile Collectivités affiche le logo du client sur fond brand, et la
// tuile vidéo joue le film Portwest en lecture automatique muette.
export interface ThematicTile {
	id: string;
	labels: Record<Lang, string>;
	image?: ImageMetadata;
	imagePositionClass?: string;
	/** Remplace object-cover, ex. `object-contain bg-white` pour ne rien rogner. */
	fitClass?: string;
	/** Logo centré sur fond brand à la place d'une photo (le logo fait office de libellé). */
	logo?: ImageMetadata;
	/**
	 * Vidéo en lecture automatique muette. `src` (fichier local sous public/, ex.
	 * `/videos/portwest.mp4`) a priorité sur `youtubeId` : déposer le fichier fourni
	 * par Portwest pour supprimer toute requête vers YouTube.
	 */
	video?: { youtubeId?: string; start?: number; src?: string };
	getHref?: (lang: Lang) => string;
}

export const thematicTiles: ThematicTile[] = [
	{
		id: 'vestes-haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'High-visibility jackets' },
		image: hiVisImage,
		// object-left : le modèle est à gauche du 2:1, object-cover recadre le mur.
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
		logo: collectivitesLogo,
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
