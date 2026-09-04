// Sélections transverses de produits, résolues par mots-clés sur le nom du
// modèle (même approche que garment-types.ts, en plus expressif) : le catalogue
// pré-calculé ne porte ni tag ni attribut saisonnier/haute-visibilité, et il ne
// peut pas être régénéré sans les exports fournisseurs locaux — tout doit donc
// rester additif et dérivé des champs existants.

export interface SelectionRule {
	/** Restreint la règle à une catégorie / sous-catégorie de la taxonomie. */
	scope?: { category?: string; subcategory?: string };
	/**
	 * Forme normale conjonctive : le nom (normalisé, sans accents) doit contenir
	 * au moins un mot-clé de CHAQUE groupe. `[['hi-vis'], ['veste','blouson']]`
	 * se lit « haute visibilité ET (veste OU blouson) ».
	 */
	groups: string[][];
	/** Aucun de ces mots-clés ne doit apparaître dans le nom. */
	exclude?: string[];
}

export interface Selection {
	slug: string;
	labels: { fr: string; en: string };
	/** Un produit appartient à la sélection si AU MOINS UNE règle matche. */
	rules: SelectionRule[];
	/**
	 * Plafond de modèles (groupes de coloris) affichés — utilisé par les
	 * sections Collectivités pour « faire ressortir quelques produits »
	 * plutôt que le catalogue entier.
	 */
	limit?: number;
}

/** Minuscules + suppression des diacritiques, pour matcher « Visibilité » avec `visibilite`. */
export function normalizeName(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');
}

/** Matching pur (partagé avec le script client des puces de sous-catégories). */
export function matchesGroups(normalizedName: string, groups: string[][], exclude?: string[]): boolean {
	if (exclude?.some((keyword) => normalizedName.includes(keyword))) return false;
	return groups.every((group) => group.some((keyword) => normalizedName.includes(keyword)));
}

export interface SelectionCandidate {
	name: string;
	category: string;
	subcategory: string | null;
}

export function matchesSelection(selection: Selection, candidate: SelectionCandidate): boolean {
	if (candidate.category === 'a-trier') return false;
	const normalizedName = normalizeName(candidate.name);
	return selection.rules.some((rule) => {
		if (rule.scope?.category && candidate.category !== rule.scope.category) return false;
		if (rule.scope?.subcategory && candidate.subcategory !== rule.scope.subcategory) return false;
		return matchesGroups(normalizedName, rule.groups, rule.exclude);
	});
}

const HI_VIS = ['haute visibilite', 'haute-visibilite', 'hi-vis', 'hivis', 'high vis', 'fluo'];

// Sélections thématiques (tuiles de la page d'accueil).
export const selections: Selection[] = [
	{
		// « Vestes haute visibilité » : exclusivement des hauts HV — le lien
		// remplace l'ancienne tuile qui menait surtout à des pantalons.
		slug: 'vestes-haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'High-visibility jackets' },
		rules: [
			{
				groups: [HI_VIS, ['veste', 'blouson', 'parka', 'softshell', 'bodywarmer', 'doudoune']],
			},
		],
	},
	{
		// « Été » : t-shirts et casquettes, cible demandée par le client.
		slug: 'ete',
		labels: { fr: 'Été', en: 'Summer' },
		rules: [
			{ groups: [['t-shirt', 'tee-shirt', 'tee shirt']] },
			{ scope: { category: 'tete' }, groups: [['casquette']] },
		],
	},
	{
		// « Hiver » : pantalons HV, vestes chaudes et sweats (demande client).
		slug: 'hiver',
		labels: { fr: 'Hiver', en: 'Winter' },
		rules: [
			{ groups: [HI_VIS, ['pantalon']] },
			{
				groups: [
					['veste', 'blouson', 'parka', 'doudoune', 'bodywarmer', 'gilet'],
					['hiver', 'chaud', 'thermique', 'matelasse', 'polaire', 'grand froid', 'winter'],
				],
			},
			{ groups: [['sweat', 'hoodie', 'pull', 'polaire']] },
		],
	},
];

// Univers Collectivités : mêmes slugs de sections que l'ancien site
// protex-epi.com (/fr/protections-tetes, /fr/haut-du-corps, …). La curation par
// mots-clés + plafond est un premier jet à faire valider par le client.
export const collectiviteSections: Selection[] = [
	{
		slug: 'protections-tetes',
		labels: { fr: 'Protections têtes', en: 'Head protection' },
		rules: [
			{
				scope: { category: 'tete' },
				groups: [['casque', 'casquette', 'bonnet', 'chapeau', 'lunette', 'anti-bruit', 'antibruit']],
			},
		],
		limit: 60,
	},
	{
		slug: 'haut-du-corps',
		labels: { fr: 'Haut du corps', en: 'Upper body' },
		rules: [
			{
				scope: { category: 'corps' },
				groups: [['polo', 't-shirt', 'tee-shirt', 'sweat', 'veste', 'softshell', 'gilet', 'parka', 'polaire']],
			},
		],
		limit: 60,
	},
	{
		slug: 'bas-du-corps',
		labels: { fr: 'Bas du corps', en: 'Lower body' },
		rules: [
			{
				scope: { category: 'corps' },
				groups: [['pantalon', 'short', 'bermuda', 'jean']],
			},
		],
		limit: 60,
	},
	{
		slug: 'vetements-intemperies',
		labels: { fr: 'Vêtements intempéries', en: 'Weatherproof clothing' },
		rules: [{ scope: { category: 'corps', subcategory: 'vetements-pluie' }, groups: [] }],
		limit: 60,
	},
	{
		slug: 'chaussures-bottes',
		labels: { fr: 'Chaussures & Bottes', en: 'Footwear & Boots' },
		rules: [
			{
				scope: { category: 'pieds' },
				groups: [['chaussure', 'botte', 'basket', 'sabot', 'brodequin']],
			},
		],
		limit: 60,
	},
];

export function getSelection(slug: string): Selection | undefined {
	return selections.find((selection) => selection.slug === slug);
}

export function getCollectiviteSection(slug: string): Selection | undefined {
	return collectiviteSections.find((section) => section.slug === slug);
}
