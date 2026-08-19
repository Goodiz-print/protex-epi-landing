import type { Lang } from './catalog';
import type { Product } from '../content/schemas/product';
import type { Category, Subcategory } from '../data/category-taxonomy';
import type { GarmentType } from '../data/garment-types';

const BRAND = 'Protex EPI';

export function homeDescription(lang: Lang): string {
	return lang === 'fr'
		? "Protex EPI, fournisseur d'équipements de protection individuelle (EPI) pour professionnels : vêtements de travail, gants, chaussures de sécurité, protections tête, yeux, ouïe et voies respiratoires."
		: 'Protex EPI, personal protective equipment (PPE) supplier for professionals: workwear, gloves, safety footwear, and head, eye, hearing and respiratory protection.';
}

export function catalogDescription(lang: Lang): string {
	return lang === 'fr'
		? `Parcourez le catalogue complet ${BRAND} : des milliers de références d'équipements de protection individuelle classées par catégorie.`
		: `Browse the full ${BRAND} catalog: thousands of personal protective equipment references organized by category.`;
}

export function categoryDescription(category: Category, lang: Lang): string {
	const label = category.labels[lang];
	return lang === 'fr'
		? `Découvrez notre gamme « ${label} » : équipements de protection individuelle certifiés pour professionnels, chez ${BRAND}.`
		: `Discover our "${label}" range: certified personal protective equipment for professionals, at ${BRAND}.`;
}

export function subcategoryDescription(category: Category, subcategory: Subcategory, lang: Lang): string {
	const label = subcategory.labels[lang];
	const parent = category.labels[lang];
	return lang === 'fr'
		? `${label} — notre sélection dans la gamme ${parent} chez ${BRAND}, des EPI certifiés pour professionnels.`
		: `${label} — our selection in the ${parent} range at ${BRAND}, certified PPE for professionals.`;
}

export function garmentTypeDescription(garmentType: GarmentType, lang: Lang): string {
	const label = garmentType.labels[lang];
	return lang === 'fr'
		? `${label} professionnels chez ${BRAND} : découvrez notre sélection, tous univers de protection confondus.`
		: `Professional ${label} at ${BRAND}: browse our selection across all protection ranges.`;
}

export function productDescription(product: Product): string {
	const text = product.description?.trim();
	if (text) return text.length > 300 ? `${text.slice(0, 297)}…` : text;
	return product.name;
}

interface JsonLdBreadcrumbItem {
	label: string;
	href?: string;
}

export function breadcrumbJsonLd(items: JsonLdBreadcrumbItem[], site: URL, currentPath: string) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.label,
			item: new URL(item.href ?? currentPath, site).toString(),
		})),
	};
}

export function productJsonLd(product: Product, url: string, site: URL) {
	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.name,
		description: productDescription(product),
		image: product.imageUrl,
		sku: product.styleCode,
		brand: { '@type': 'Brand', name: product.supplier },
		offers: {
			'@type': 'Offer',
			url: new URL(url, site).toString(),
			priceCurrency: product.currency,
			price: product.price,
			availability: 'https://schema.org/InStock',
		},
	};
}
