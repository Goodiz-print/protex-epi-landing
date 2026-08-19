export type Lang = 'fr' | 'en';

const CATALOG_ROOT: Record<Lang, string> = {
	fr: '/produits',
	en: '/en/products',
};

export function getCatalogRootUrl(lang: Lang): string {
	return CATALOG_ROOT[lang];
}

export function getCategoryUrl(lang: Lang, categorySlug: string): string {
	return `${CATALOG_ROOT[lang]}/${categorySlug}`;
}

export function getGarmentTypeUrl(lang: Lang, typeSlug: string): string {
	return `${CATALOG_ROOT[lang]}/type/${typeSlug}`;
}

export function getSubcategoryUrl(lang: Lang, categorySlug: string, subcategorySlug: string): string {
	return `${CATALOG_ROOT[lang]}/${categorySlug}/${subcategorySlug}`;
}

export function getProductUrl(
	lang: Lang,
	categorySlug: string,
	subcategorySlug: string | null,
	productSlug: string,
): string {
	const subcategorySegment = subcategorySlug ?? '_';
	return `${CATALOG_ROOT[lang]}/${categorySlug}/${subcategorySegment}/${productSlug}`;
}

const QUOTE_ROOT: Record<Lang, string> = {
	fr: '/devis',
	en: '/en/quote',
};

export function getQuoteUrl(lang: Lang): string {
	return QUOTE_ROOT[lang];
}
