// « Top résultats » demandés par le client (sept. 2026) : sur certaines pages de
// sous-catégorie, les modèles emblématiques remontent en tête du listing (casques
// sur Protection de la tête, lunettes sur Protection des yeux, vestes sur Haute
// visibilité). Le tri est stable : les autres modèles gardent l'ordre catalogue.
// Même mécanique mots-clés que selections.ts / refinements.ts (CNF sur le nom
// normalisé), appliquée côté serveur dans getProductsBySubcategory — le HTML
// pré-rendu et listing.json partagent donc le même ordre.

export interface ListingPriority {
	groups: string[][];
	exclude?: string[];
}

export const listingPriorities: Record<string, ListingPriority> = {
	'tete/protection-tete': {
		groups: [['casque', 'helmet', 'expertbase']],
		exclude: [
			'pour casque',
			'du casque',
			'de casque',
			'jugulaire',
			'mentonniere',
			'anti-bruit',
			'antibruit',
			'casquette',
			'bonnet',
			'serre-tete',
			'support',
		],
	},
	'tete/protection-yeux': {
		groups: [['lunette', 'glasses', 'goggle']],
		exclude: ['pour lunettes', 'a lunettes', 'etui', 'cordon', 'lingette'],
	},
	'corps/vetements-haute-visibilite': {
		groups: [['veste', 'blouson', 'parka', 'softshell']],
		// « Pantalon softshell », « Gilet softshell » ou « Short … » ne sont pas des vestes.
		exclude: ['pantalon', 'short', 'bermuda', 'gilet', 'bodywarmer', 'sans manche', 'jupe', 'salopette'],
	},
};

export function getListingPriority(categorySlug: string, subcategorySlug: string): ListingPriority | undefined {
	return listingPriorities[`${categorySlug}/${subcategorySlug}`];
}
