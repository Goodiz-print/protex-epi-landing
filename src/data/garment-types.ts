export interface GarmentType {
	slug: string;
	labels: { fr: string; en: string };
	keywords: string[];
}

export const garmentTypes: GarmentType[] = [
	{ slug: 't-shirts', labels: { fr: 'T-shirts', en: 'T-shirts' }, keywords: ['t-shirt', 'tee-shirt'] },
	{ slug: 'polos', labels: { fr: 'Polos', en: 'Polos' }, keywords: ['polo'] },
	{
		slug: 'vestes-sweats',
		labels: { fr: 'Vestes & Sweats', en: 'Jackets & Sweatshirts' },
		keywords: ['veste', 'sweat', 'blouson', 'softshell'],
	},
	{ slug: 'pantalons', labels: { fr: 'Pantalons', en: 'Trousers' }, keywords: ['pantalon', 'short'] },
];

export function getGarmentType(typeSlug: string): GarmentType | undefined {
	return garmentTypes.find((type) => type.slug === typeSlug);
}
