import type { Product } from '~/content/schemas/product';

/** Image locale servie quand aucune photo fournisseur valide n'est connue (cf. scripts/lib/supplier-csv.ts). */
export const PLACEHOLDER_IMAGE_URL = '/images/product-placeholder.svg';

export function hasProductImage(product: Pick<Product, 'imageUrl'>): boolean {
	return product.imageUrl !== PLACEHOLDER_IMAGE_URL;
}

/**
 * Fiche fournisseur incomplète, non publiée plutôt que d'afficher une carte vide :
 * - ni photo valide, ni prix : références pas encore commercialisées sur le marché FR
 *   (nom anglais brut dans l'export, photo absente du CDN — retour client « images
 *   manquantes » dans Pieds > Bottes de sécurité) ;
 * - ligne vide (ni nom, ni coloris, ni description) : ligne de tarif Portwest sans
 *   fiche produit que scripts/complete-catalog.mjs n'a pas su nommer (ni coloris voisin
 *   nommé, ni entrée dans src/data/product-overrides.<fournisseur>.json).
 */
export function isIncompleteProduct(
	product: Pick<Product, 'imageUrl' | 'price' | 'name' | 'colour' | 'description'>,
): boolean {
	if (!product.name.trim() && !product.colour.trim() && !product.description.trim()) return true;
	return !hasProductImage(product) && !(product.price > 0);
}

/**
 * Tri stable : les produits avec photo d'abord, ceux qui n'ont que l'image de
 * substitution en fin de liste — l'ordre relatif de chaque moitié est conservé.
 */
export function demoteProductsWithoutImage<T extends Pick<Product, 'imageUrl'>>(products: T[]): T[] {
	const withImage = products.filter(hasProductImage);
	if (withImage.length === products.length) return products;
	return [...withImage, ...products.filter((product) => !hasProductImage(product))];
}
