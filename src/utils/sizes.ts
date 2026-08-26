// Canonical letter-size order, smallest to largest. Numeric sizes (shoe/waist
// sizes like "42" or "C46") are ranked by their numeric value instead.
// prettier-ignore
const ALPHA_ORDER = ['4XS', 'XXXXS', '3XS', 'XXXS', '2XS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'XXXXL', '4XL', '5XL', '6XL', '7XL', '8XL'];

function alphaRank(size: string): number {
	return ALPHA_ORDER.indexOf(size.trim().toUpperCase());
}

function numericRank(size: string): number | null {
	const match = size.match(/\d+(?:[.,]\d+)?/);
	return match ? Number.parseFloat(match[0].replace(',', '.')) : null;
}

/**
 * Collapses a size list into the "S - 6XL" range shown on product cards.
 * Returns null when there is nothing meaningful to show.
 */
export function formatSizeRange(sizes: string[]): string | null {
	const cleaned = [...new Set(sizes.map((size) => size.trim()).filter(Boolean))];
	if (cleaned.length === 0) return null;
	if (cleaned.length === 1) return cleaned[0];

	const alphaRanks = cleaned.map(alphaRank);
	if (alphaRanks.every((rank) => rank >= 0)) {
		const min = cleaned[alphaRanks.indexOf(Math.min(...alphaRanks))];
		const max = cleaned[alphaRanks.indexOf(Math.max(...alphaRanks))];
		return `${min} - ${max}`;
	}

	const numericRanks = cleaned.map(numericRank);
	if (numericRanks.every((rank) => rank !== null)) {
		const ranks = numericRanks as number[];
		const min = cleaned[ranks.indexOf(Math.min(...ranks))];
		const max = cleaned[ranks.indexOf(Math.max(...ranks))];
		return `${min} - ${max}`;
	}

	return `${cleaned[0]} - ${cleaned[cleaned.length - 1]}`;
}
