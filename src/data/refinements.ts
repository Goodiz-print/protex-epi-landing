// Sous-catégories de niveau 3 (liste fournie par le client, sept. 2026),
// affichées uniquement en haut des pages de sous-catégorie sous forme de puces
// de filtre — pas dans le menu, pas de routes dédiées. Le matching réutilise
// la mécanique mots-clés de selections.ts, appliquée côté client au nom du
// modèle (champ `t` du payload listing.json).

export interface Refinement {
	slug: string;
	labels: { fr: string; en: string };
	/** Même sémantique que SelectionRule.groups (CNF sur le nom normalisé). */
	groups: string[][];
	exclude?: string[];
}

export const refinements: Record<string, Refinement[]> = {
	'corps/vetements-travail': [
		{
			slug: 'tee-shirts-polos',
			labels: { fr: 'Tee-Shirts & Polos', en: 'T-shirts & Polos' },
			groups: [['t-shirt', 'tee-shirt', 'tee shirt', 'polo']],
		},
		{
			slug: 'sweats-pulls-polaires',
			labels: { fr: 'Sweats, Pulls, Polaires & Gilets', en: 'Sweatshirts, Jumpers, Fleeces & Vests' },
			groups: [['sweat', 'pull', 'polaire', 'hoodie', 'gilet']],
		},
		{
			slug: 'gilets-vestes-sans-manche',
			labels: { fr: 'Gilets & Vestes sans manche', en: 'Vests & Bodywarmers' },
			groups: [['gilet', 'bodywarmer', 'sans manche']],
		},
		{
			slug: 'vestes-softshells-blousons-parkas',
			labels: { fr: 'Vestes, Softshells, Blousons & Parkas', en: 'Jackets, Softshells & Parkas' },
			groups: [['veste', 'softshell', 'blouson', 'parka']],
		},
		{
			slug: 'pantalons-travail',
			labels: { fr: 'Pantalons de travail', en: 'Work trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'bermudas-shorts',
			labels: { fr: 'Bermudas & Shorts de travail', en: 'Work shorts' },
			groups: [['bermuda', 'short']],
		},
		{
			slug: 'combinaisons-cottes-salopettes',
			labels: { fr: 'Combinaisons, Cottes & Salopettes', en: 'Coveralls, Bib & Brace' },
			groups: [['combinaison', 'cotte', 'salopette']],
		},
		{
			slug: 'vetements-multirisques',
			labels: { fr: 'Vêtements multirisques', en: 'Multi-risk clothing' },
			groups: [['multirisque', 'multi-risque', 'bizflame', 'ignifuge', 'retardateur de flamme', 'antistatique', 'arc']],
		},
		{
			slug: 'vetements-rafraichissants-chaleur',
			labels: { fr: 'Vêtements rafraîchissants, Protection Chaleur', en: 'Cooling & Heat protection' },
			groups: [['rafraichissant', 'cooling', 'anti-uv', 'protection solaire', 'chaleur']],
		},
		{
			slug: 'vetements-jetables',
			labels: { fr: 'Vêtements jetables, Usage unique', en: 'Disposable clothing' },
			groups: [['jetable', 'usage unique']],
		},
		{ slug: 'tabliers', labels: { fr: 'Tabliers', en: 'Aprons' }, groups: [['tablier']] },
		{ slug: 'blouses', labels: { fr: 'Blouses', en: 'Coats & Smocks' }, groups: [['blouse']] },
		{
			slug: 'accessoires',
			labels: { fr: 'Accessoires', en: 'Accessories' },
			groups: [['ceinture', 'bretelle', 'genouillere', 'chaussette', 'bonnet', 'echarpe', 'tour de cou', 'accessoire']],
		},
	],
	'corps/vetements-haute-visibilite': [
		{
			slug: 'gilets-haute-visibilite',
			labels: { fr: 'Gilets haute visibilité', en: 'Hi-vis vests' },
			groups: [['gilet', 'baudrier']],
		},
		{
			slug: 't-shirts-polos-haute-visibilite',
			labels: { fr: 'T-shirts et Polos haute visibilité', en: 'Hi-vis t-shirts & polos' },
			groups: [['t-shirt', 'tee-shirt', 'polo']],
		},
		{
			slug: 'sweats-polaires-haute-visibilite',
			labels: { fr: 'Sweats et Polaires haute visibilité', en: 'Hi-vis sweatshirts & fleeces' },
			groups: [['sweat', 'polaire', 'pull']],
		},
		{
			slug: 'bodywarmers-haute-visibilite',
			labels: { fr: 'Bodywarmers haute visibilité', en: 'Hi-vis bodywarmers' },
			groups: [['bodywarmer', 'sans manche']],
		},
		{
			slug: 'vestes-haute-visibilite',
			labels: { fr: 'Vestes haute visibilité', en: 'Hi-vis jackets' },
			groups: [['veste', 'blouson', 'parka', 'softshell']],
		},
		{
			slug: 'pantalons-haute-visibilite',
			labels: { fr: 'Pantalons haute visibilité', en: 'Hi-vis trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'bermudas-haute-visibilite',
			labels: { fr: 'Bermudas haute visibilité', en: 'Hi-vis shorts' },
			groups: [['bermuda', 'short']],
		},
	],
	'corps/vetements-pluie': [
		{
			slug: 'vestes-pluie',
			labels: { fr: 'Vestes de pluie', en: 'Rain jackets' },
			groups: [['veste', 'blouson', 'parka', 'cire']],
		},
		{
			slug: 'pantalons-pluie',
			labels: { fr: 'Pantalons de pluie', en: 'Rain trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'combinaisons-ensembles-pluie',
			labels: { fr: 'Combinaisons & Ensembles de pluie', en: 'Rain coveralls & suits' },
			groups: [['combinaison', 'ensemble']],
		},
	],
	'corps/equipement-antichute': [
		{ slug: 'harnais', labels: { fr: 'Harnais de sécurité', en: 'Safety harnesses' }, groups: [['harnais']] },
		{
			slug: 'accessoires-antichute',
			labels: { fr: 'Accessoires antichute', en: 'Fall-arrest accessories' },
			groups: [],
			exclude: ['harnais'],
		},
	],
};

export function getRefinements(categorySlug: string, subcategorySlug: string | null): Refinement[] {
	if (!subcategorySlug) return [];
	return refinements[`${categorySlug}/${subcategorySlug}`] ?? [];
}
