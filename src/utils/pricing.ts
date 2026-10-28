// Les JSON du catalogue portent le prix fournisseur ; le prix affiché sur le site
// (fiches, listings, tri, recherche) applique ce coefficient au chargement.
export const PRICE_MULTIPLIER = 1.7;

/** Prix de vente affiché, arrondi au centime. 0 (prix inconnu) reste 0. */
export function applyPriceMultiplier(supplierPrice: number): number {
	// toPrecision absorbe l'erreur flottante (12,35 × 1,7 = 20,994999…) avant l'arrondi.
	return Math.round(Number((supplierPrice * PRICE_MULTIPLIER * 100).toPrecision(12))) / 100;
}
