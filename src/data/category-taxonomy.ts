export interface Subcategory {
	slug: string;
	labels: { fr: string; en: string };
}

export interface Category {
	slug: string;
	labels: { fr: string; en: string };
	subcategories: Subcategory[];
}

export const categoryTaxonomy: Category[] = [
	{
		slug: 'tete',
		labels: { fr: 'Tête', en: 'Head' },
		subcategories: [
			{ slug: 'protection-tete', labels: { fr: 'Protection de la tête', en: 'Head protection' } },
			{ slug: 'protection-yeux', labels: { fr: 'Protection des yeux', en: 'Eye protection' } },
			{ slug: 'protection-ouie', labels: { fr: "Protection de l'ouïe", en: 'Hearing protection' } },
			{
				slug: 'protection-respiratoire',
				labels: { fr: 'Protection des voies respiratoires', en: 'Respiratory protection' },
			},
		],
	},
	{
		slug: 'corps',
		labels: { fr: 'Corps', en: 'Body' },
		subcategories: [
			{ slug: 'vetements-travail', labels: { fr: 'Vêtements de travail', en: 'Workwear' } },
			{ slug: 'vetements-pluie', labels: { fr: 'Vêtements de pluie', en: 'Rainwear' } },
			{
				slug: 'vetements-haute-visibilite',
				labels: { fr: 'Vêtements haute visibilité', en: 'High-visibility clothing' },
			},
			{ slug: 'equipement-antichute', labels: { fr: 'Équipement antichute', en: 'Fall protection equipment' } },
		],
	},
	{
		slug: 'mains',
		labels: { fr: 'Mains', en: 'Hands' },
		subcategories: [
			{ slug: 'gants-protection', labels: { fr: 'Gants de protection', en: 'Protective gloves' } },
			{ slug: 'outils-coupe', labels: { fr: 'Outils de coupe sécurisés', en: 'Secure cutting tools' } },
			{ slug: 'hygiene-sante', labels: { fr: 'Hygiène & Santé', en: 'Hygiene & health' } },
		],
	},
	{
		slug: 'pieds',
		labels: { fr: 'Pieds', en: 'Feet' },
		subcategories: [
			{ slug: 'chaussures-basses', labels: { fr: 'Chaussures basses de sécurité', en: 'Low safety shoes' } },
			{ slug: 'chaussures-hautes', labels: { fr: 'Chaussures hautes de sécurité', en: 'High safety shoes' } },
			{ slug: 'bottes', labels: { fr: 'Bottes de sécurité', en: 'Safety boots' } },
			{ slug: 'accessoires-chaussures', labels: { fr: 'Accessoires pour chaussures', en: 'Shoe accessories' } },
		],
	},
	{
		slug: 'usage-unique',
		labels: { fr: 'Usage unique', en: 'Single use' },
		subcategories: [],
	},
	{
		slug: 'a-trier',
		labels: { fr: 'À trier', en: 'To sort' },
		subcategories: [],
	},
];

export function getCategory(categorySlug: string): Category | undefined {
	return categoryTaxonomy.find((category) => category.slug === categorySlug);
}

export function getSubcategory(categorySlug: string, subcategorySlug: string): Subcategory | undefined {
	return getCategory(categorySlug)?.subcategories.find((subcategory) => subcategory.slug === subcategorySlug);
}
