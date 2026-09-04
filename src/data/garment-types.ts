/**
 * Types de vêtements : pages de listing transverses construites par mots-clés
 * sur le nom des produits (le catalogue fournisseur ne porte pas ce niveau de
 * classification). Un type peut être rattaché à une sous-catégorie parente via
 * `parent` : sa tuile s'affiche alors en haut de la page de cette
 * sous-catégorie (et uniquement là — pas dans le menu).
 */

export interface GarmentTypeRule {
	/** Restreint la règle à une catégorie (slug de category-taxonomy). */
	category?: string;
	/** Restreint la règle à une sous-catégorie. */
	subcategory?: string;
	/** Le nom du produit doit contenir un de ces mots-clés (omis = tout le périmètre). */
	keywords?: string[];
}

export interface GarmentType {
	slug: string;
	labels: { fr: string; en: string };
	/** Un produit correspond dès qu'une règle correspond. */
	rules: GarmentTypeRule[];
	/** Exclusions par mots-clés, appliquées après les règles. */
	exclude?: string[];
	/** Sous-catégorie parente dont la page affiche la tuile de ce type. */
	parent?: { category: string; subcategory: string };
}

const TRAVAIL = { category: 'corps', subcategory: 'vetements-travail' };
const HAUTE_VISIBILITE = { category: 'corps', subcategory: 'vetements-haute-visibilite' };
const PLUIE = { category: 'corps', subcategory: 'vetements-pluie' };
const ANTICHUTE = { category: 'corps', subcategory: 'equipement-antichute' };

export const garmentTypes: GarmentType[] = [
	// --- Vêtements de travail -------------------------------------------------
	{
		slug: 'tee-shirts-polos',
		labels: { fr: 'Tee-Shirts & Polos', en: 'T-shirts & Polos' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['t-shirt', 'tee-shirt', 'polo', 'débardeur'] }],
	},
	{
		slug: 'sweats-pulls-polaires',
		labels: { fr: 'Sweats, Pulls & Polaires', en: 'Sweatshirts, Jumpers & Fleeces' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['sweat', 'pull', 'polaire', 'cardigan'] }],
	},
	{
		slug: 'gilets-vestes-sans-manche',
		labels: { fr: 'Gilets & Vestes sans manche', en: 'Bodywarmers & Sleeveless jackets' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['gilet', 'sans manche', 'bodywarmer'] }],
	},
	{
		slug: 'vestes-softshells-blousons-parkas',
		labels: { fr: 'Vestes, Softshells, Blousons & Parkas', en: 'Jackets, Softshells & Parkas' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['veste', 'softshell', 'blouson', 'parka', 'manteau', 'doudoune'] }],
		exclude: ['sans manche'],
	},
	{
		slug: 'pantalons-travail',
		labels: { fr: 'Pantalons de travail', en: 'Work trousers' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['pantalon', 'pantacourt', 'jean'] }],
	},
	{
		slug: 'bermudas-shorts',
		labels: { fr: 'Bermudas & Shorts de travail', en: 'Work shorts' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['bermuda', 'short'] }],
	},
	{
		slug: 'combinaisons-cottes-salopettes',
		labels: { fr: 'Combinaisons, Cottes & Salopettes', en: 'Coveralls, Bib & Brace' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['combinaison', 'cotte', 'salopette'] }],
	},
	{
		slug: 'vetements-multirisques',
		labels: { fr: 'Vêtements multirisques', en: 'Multi-risk clothing' },
		parent: TRAVAIL,
		rules: [
			{
				...TRAVAIL,
				keywords: [
					'multirisque',
					'multi-risque',
					'multinorme',
					'bizflame',
					'modaflame',
					'ignifug',
					'retardateur de flamme',
					'anti-flamme',
					'antistatique',
					'soudeur',
					'soudure',
				],
			},
		],
	},
	{
		slug: 'vetements-rafraichissants-protection-chaleur',
		labels: { fr: 'Vêtements rafraîchissants, Protection Chaleur', en: 'Cooling & Heat protection' },
		parent: TRAVAIL,
		rules: [
			{
				...TRAVAIL,
				keywords: ['rafraîchiss', 'rafraichiss', 'cooling', 'anti-chaleur', 'protection chaleur', 'aluminis'],
			},
		],
	},
	{
		slug: 'vetements-jetables-usage-unique',
		labels: { fr: 'Vêtements jetables, Usage unique', en: 'Disposable clothing' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['jetable', 'usage unique', 'biztex'] }, { category: 'usage-unique' }],
	},
	{
		slug: 'tabliers',
		labels: { fr: 'Tabliers', en: 'Aprons' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['tablier'] }],
	},
	{
		slug: 'blouses',
		labels: { fr: 'Blouses', en: 'Coats & Smocks' },
		parent: TRAVAIL,
		rules: [{ ...TRAVAIL, keywords: ['blouse'] }],
	},
	{
		slug: 'accessoires-vetements',
		labels: { fr: 'Accessoires', en: 'Accessories' },
		parent: TRAVAIL,
		rules: [
			{
				...TRAVAIL,
				keywords: [
					'ceinture',
					'bretelle',
					'bonnet',
					'casquette',
					'chaussette',
					'écharpe',
					'cagoule',
					'genouillère',
					'chapeau',
					'tour de cou',
				],
			},
		],
	},

	// --- Vêtements haute visibilité ------------------------------------------
	{
		slug: 'gilets-haute-visibilite',
		labels: { fr: 'Gilets haute visibilité', en: 'Hi-vis vests' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['gilet', 'baudrier', 'chasuble'] }],
		exclude: ['softshell'],
	},
	{
		slug: 't-shirts-polos-haute-visibilite',
		labels: { fr: 'T-shirts et Polos haute visibilité', en: 'Hi-vis T-shirts & Polos' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['t-shirt', 'tee-shirt', 'polo'] }],
	},
	{
		slug: 'sweats-polaires-haute-visibilite',
		labels: { fr: 'Sweats et Polaires haute visibilité', en: 'Hi-vis sweatshirts & fleeces' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['sweat', 'polaire', 'pull'] }],
	},
	{
		slug: 'bodywarmers-haute-visibilite',
		labels: { fr: 'Bodywarmers haute visibilité', en: 'Hi-vis bodywarmers' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['bodywarmer', 'doudoune', 'sans manche'] }],
	},
	{
		slug: 'vestes-haute-visibilite',
		labels: { fr: 'Vestes haute visibilité', en: 'Hi-vis jackets' },
		parent: HAUTE_VISIBILITE,
		rules: [
			{ ...HAUTE_VISIBILITE, keywords: ['veste', 'parka', 'blouson', 'softshell', 'bombers', 'manteau'] },
		],
		exclude: ['sans manche'],
	},
	{
		slug: 'pantalons-haute-visibilite',
		labels: { fr: 'Pantalons haute visibilité', en: 'Hi-vis trousers' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['pantalon', 'pantacourt', 'jogging'] }],
	},
	{
		slug: 'bermudas-haute-visibilite',
		labels: { fr: 'Bermudas haute visibilité', en: 'Hi-vis shorts' },
		parent: HAUTE_VISIBILITE,
		rules: [{ ...HAUTE_VISIBILITE, keywords: ['bermuda', 'short'] }],
	},

	// --- Vêtements de pluie ---------------------------------------------------
	{
		slug: 'vestes-pluie',
		labels: { fr: 'Vestes de pluie', en: 'Rain jackets' },
		parent: PLUIE,
		rules: [{ ...PLUIE, keywords: ['veste', 'parka', 'blouson', 'manteau', 'imperméable', 'coupe-vent'] }],
	},
	{
		slug: 'pantalons-pluie',
		labels: { fr: 'Pantalons de pluie', en: 'Rain trousers' },
		parent: PLUIE,
		rules: [{ ...PLUIE, keywords: ['pantalon', 'pantacourt'] }],
	},
	{
		slug: 'combinaisons-ensembles-pluie',
		labels: { fr: 'Combinaisons & Ensembles de pluie', en: 'Rain coveralls & suits' },
		parent: PLUIE,
		rules: [{ ...PLUIE, keywords: ['combinaison', 'ensemble', 'cotte', 'salopette'] }],
	},

	// --- Équipement antichute -------------------------------------------------
	{
		slug: 'harnais-securite',
		labels: { fr: 'Harnais de sécurité', en: 'Safety harnesses' },
		parent: ANTICHUTE,
		rules: [{ ...ANTICHUTE, keywords: ['harnais'] }],
	},
	{
		slug: 'accessoires-antichute',
		labels: { fr: 'Accessoires antichute', en: 'Fall-arrest accessories' },
		parent: ANTICHUTE,
		rules: [
			{
				...ANTICHUTE,
				keywords: [
					'longe',
					'mousqueton',
					'sangle',
					'lanière',
					'cordon',
					'ligne de vie',
					'antichute',
					'enrouleur',
					'connecteur',
					'crochet',
					'élingue',
					'elingue',
					'absorbeur',
					'ancrage',
					'kit',
				],
			},
		],
	},

	// --- Sélections saisonnières (tuiles de la page d'accueil) ----------------
	{
		slug: 'ete',
		labels: { fr: 'Été', en: 'Summer' },
		rules: [{ keywords: ['t-shirt', 'tee-shirt'] }, { keywords: ['casquette'] }],
	},
	{
		slug: 'hiver',
		labels: { fr: 'Hiver', en: 'Winter' },
		rules: [
			{ ...HAUTE_VISIBILITE, keywords: ['pantalon'] },
			{
				category: 'corps',
				keywords: ['sweat', 'polaire', 'parka', 'bodywarmer', 'doudoune', 'hiver', 'thermique', 'grand froid', 'matelass', 'blouson'],
			},
		],
	},
];

export function getGarmentType(typeSlug: string): GarmentType | undefined {
	return garmentTypes.find((type) => type.slug === typeSlug);
}

/** Types affichés en tuiles en haut de la page d'une sous-catégorie. */
export function getGarmentTypesBySubcategory(categorySlug: string, subcategorySlug: string): GarmentType[] {
	return garmentTypes.filter(
		(type) => type.parent?.category === categorySlug && type.parent?.subcategory === subcategorySlug,
	);
}
