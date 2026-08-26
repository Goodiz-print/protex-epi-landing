import type { Lang } from './catalog';

const LOCALE_BY_LANG: Record<Lang, string> = {
	fr: 'fr-FR',
	en: 'en-GB',
};

export function formatPrice(price: number, lang: Lang): string {
	return new Intl.NumberFormat(LOCALE_BY_LANG[lang], { style: 'currency', currency: 'EUR' }).format(price);
}

export function formatPriceRange(min: number, max: number, lang: Lang): string {
	if (min === max) return formatPrice(min, lang);
	return `${formatPrice(min, lang)} – ${formatPrice(max, lang)}`;
}
