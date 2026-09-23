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
	 * Plafond de modèles (groupes de coloris) affichés, appliqué aux règles.
	 */
	limit?: number;
	/**
	 * Sélection explicite de modèles (clés `supplier:styleCode`, cf. styleKey de
	 * utils/product-groups.ts), affichés dans cet ordre avec tous leurs coloris.
	 * Quand `picks` est renseigné, `rules`/`limit` sont ignorés — utilisé par les
	 * sections Collectivités pour « faire ressortir uniquement quelques produits ».
	 */
	picks?: string[];
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
// protex-epi.com (/fr/protections-tetes, /fr/haut-du-corps, …). Le client veut
// « uniquement quelques produits susceptibles de plaire à une collectivité » :
// chaque section est une courte liste de modèles choisis à la main dans le
// catalogue (inspiration : gamme collectivités epi-store — agents des services
// techniques, voirie, espaces verts, propreté), dans l'ordre d'affichage voulu.
// Proposition à faire valider par le client ; `rules` sert de repli si un
// modèle disparaît du catalogue (jamais utilisé tant que `picks` matche).
export const collectiviteSections: Selection[] = [
	{
		slug: 'protections-tetes',
		labels: { fr: 'Protections têtes', en: 'Head protection' },
		picks: [
			'portwest:PS55', // Casque Endurance (6 coloris)
			'portwest:PW50', // Casque de sécurité Expertbase
			'portwest:PS63', // Casque Travaux en hauteur Endurance ventilé
			'portwest:PS59', // Casquette anti-heurt AirTech
			'portwest:PW79', // Casquette anti-heurt visière longue
			'portwest:HB10', // Casquette baseball HV
			'portwest:HA22', // Casquette de protection solaire respirante
			'portwest:HA14', // Bonnet Hi-Vis réversible
			'blaklader:20631037', // Bonnet stretch jaune fluo
			'portwest:PW32', // Lunette Enveloppante
			'portwest:PS33', // Lunette de sécurité PW Screen Plus
			'portwest:PW40', // Casque anti-bruit Classic
			'portwest:PS41', // Casque Anti-bruit Super HV
			'portwest:EP13', // Bouchons d'oreille en mousse PU (30 paires)
		],
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
		picks: [
			'portwest:S466', // Parka HV Bicolore (6 coloris)
			'portwest:PW367', // Parka PW3 Hi-Vis 5-en-1
			'portwest:DX466', // Parka 4 en 1 DX4 Hi-Vis
			'portwest:T402', // Softshell Haute-Visibilité PW3
			'portwest:S424', // Veste softshell Classic Hi-Vis
			'portwest:T164', // Veste de travail HV avec panneaux en mesh
			'portwest:CD861', // Veste de travail WX2 Eco Hi-Vis
			'portwest:PW374', // Bodywarmer réversible haute visibilité PW3
			'portwest:C472', // Gilet à bandes et à bretelles Hi-Vis
			'portwest:S477', // Polo Hi-Vis manches courtes
			'portwest:T180', // Polo HV PW3
			'portwest:S277', // Polo HV Manches Longues
			'portwest:S478', // T-Shirt Hi-Vis
			'portwest:B303', // Sweatshirt Haute Visibilité
			'portwest:B317', // Sweat Hi-Vis bicolore zippé à capuche
			'portwest:CD812', // Polo WX2 manches courtes (uni, pour les services)
		],
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
		picks: [
			'portwest:ES046', // Pantalon de travail HV Essential ES1 (4 coloris)
			'portwest:L049', // Pantalon combat Hi-Vis Bicolore
			'portwest:TX71', // Pantalon Haute-Visibilité Séville
			'portwest:PW342', // Pantalon extrême haute visibilité PW3
			'portwest:DX453', // Pantalon de travail stretch DX4 HV
			'portwest:CD888', // Pantalon de travail stretch HV Classe 1 Eco WX2
			'portwest:CD131', // Pantalon de travail coton léger WX1
			'portwest:CD111', // Pantalon de travail en coton bicolore WX1
			'portwest:T601', // Pantalon PW3
			'portwest:E043', // Bermuda HiVis Poly-coton
			'portwest:L043', // Short en poly-coton léger haute visibilité
			'portwest:S790', // Bermuda Combat
			'portwest:CD114', // Bermuda coton bicolore WX1
		],
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
		picks: [
			'portwest:S466', // Parka HV Bicolore
			'portwest:BX323', // Veste de pluie Ultimate haute-visibilité 3 en 1
			'portwest:T166', // Veste de pluie HV PW3 (3L)
			'portwest:S166', // Veste de pluie HV bicolore
			'portwest:ES440', // Veste de pluie HV Essential ES1
			'portwest:S440', // Veste de pluie Classic (6 coloris)
			'portwest:S250', // Veste Sealtex Ocean
			'portwest:H444', // Pantalon de pluie Hi-Vis bicolore
			'portwest:DX448', // Pantalon de pluie DX4 HV
			'portwest:S441', // Pantalon de pluie Classic
			'portwest:L440', // Ensemble de pluie (veste + pantalon)
			'portwest:L450', // Ensemble de pluie Sealtex Essential
		],
		rules: [{ scope: { category: 'corps', subcategory: 'vetements-pluie' }, groups: [] }],
		limit: 60,
	},
	{
		slug: 'chaussures-bottes',
		labels: { fr: 'Chaussures & Bottes', en: 'Footwear & Boots' },
		picks: [
			'portwest:FW43', // Derby Steelite Kumo S3
			'portwest:FC24', // Chaussures basses composite textile S1 SR FO
			'portwest:FD27', // Chaussure Compositelite Protector S3 ESD HRO
			'portwest:FT22', // Basket textile 0B ESD SR
			'portwest:FW02', // Steelite Trainer aéré S1P
			'portwest:FW24', // Brodequin S3 Kumo surembout renforcé
			'portwest:FW69', // Brodequin Mustang Steelite S3
			'portwest:FC60', // Brodequin cuir nubuck composite S3S HRO
			'portwest:FE01', // Chaussure haute Bevel Composite S3S ESD
			'portwest:FW95', // Bottes de sécurité Wellington S5 (4 coloris)
			'portwest:FD33', // Botte Steelite Kumo doublée de fourrure S3
			'portwest:FD05', // Botte fourrée S3L SC HRO CI SR
		],
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
