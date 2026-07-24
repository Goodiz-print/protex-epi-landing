import { slugify } from '../../utils/slugify';
import type { Product } from '../schemas/product';

export interface PortwestCsvRow {
	[column: string]: string;
}

export interface ProductGroup {
	styleCode: string;
	colour: string;
	rows: PortwestCsvRow[];
}

export function groupPortwestRows(rows: PortwestCsvRow[]): ProductGroup[] {
	const groups = new Map<string, ProductGroup>();
	for (const row of rows) {
		const styleCode = row['Style Code'];
		const colour = row['Colour'];
		const key = `${styleCode}::${colour}`;
		let group = groups.get(key);
		if (!group) {
			group = { styleCode, colour, rows: [] };
			groups.set(key, group);
		}
		group.rows.push(row);
	}
	return Array.from(groups.values());
}

export interface DeterministicValue<T> {
	value: T;
	hadMismatch: boolean;
	ignoredValues: T[];
}

/** Picks the first-encountered value deterministically; flags when later rows in the group disagree. */
export function resolveDeterministicValue<T>(values: T[]): DeterministicValue<T> {
	const [value, ...rest] = values;
	const ignoredValues = Array.from(new Set(rest.filter((candidate) => candidate !== value)));
	return { value, hadMismatch: ignoredValues.length > 0, ignoredValues };
}

export function buildSizesList(rows: PortwestCsvRow[]): string[] {
	const seen = new Set<string>();
	const sizes: string[] = [];
	for (const row of rows) {
		const size = row['Size'];
		if (size && !seen.has(size)) {
			seen.add(size);
			sizes.push(size);
		}
	}
	return sizes;
}

export function buildProductSlug(name: string, colour: string, styleCode: string): string {
	return `${slugify(`${name} ${colour}`)}-${slugify(styleCode)}`;
}

export function buildEntryId(supplier: string, styleCode: string, colour: string): string {
	return `${supplier}:${styleCode}:${slugify(colour)}`;
}

export interface CategoryMappingEntry {
	category: string;
	subcategory: string | null;
}

export type CategoryMapping = Record<string, CategoryMappingEntry>;

const UNCLASSIFIED: CategoryMappingEntry = { category: 'a-trier', subcategory: null };

export function resolveCategory(mapping: CategoryMapping, styleCode: string): CategoryMappingEntry {
	return mapping[styleCode] ?? UNCLASSIFIED;
}

export interface BuildProductEntryResult {
	id: string;
	data: Product;
	warnings: string[];
}

export function buildProductEntry(
	supplier: 'portwest' | 'mascot' | 'blaklader',
	group: ProductGroup,
	mapping: CategoryMapping,
): BuildProductEntryResult {
	const warnings: string[] = [];
	const firstRow = group.rows[0];
	const name = firstRow['Product'];
	const description = firstRow['Description'];

	const priceResolution = resolveDeterministicValue(group.rows.map((row) => Number(row['Price'])));
	if (priceResolution.hadMismatch) {
		warnings.push(
			`price mismatch for styleCode=${group.styleCode} colour="${group.colour}": using ${priceResolution.value}, ignored [${priceResolution.ignoredValues.join(', ')}]`,
		);
	}

	const imageResolution = resolveDeterministicValue(group.rows.map((row) => row['Image']));
	if (imageResolution.hadMismatch) {
		warnings.push(
			`image mismatch for styleCode=${group.styleCode} colour="${group.colour}": using ${imageResolution.value}, ignored [${imageResolution.ignoredValues.join(', ')}]`,
		);
	}

	const { category, subcategory } = resolveCategory(mapping, group.styleCode);
	const id = buildEntryId(supplier, group.styleCode, group.colour);
	const slug = buildProductSlug(name, group.colour, group.styleCode);

	return {
		id,
		data: {
			id,
			supplier,
			styleCode: group.styleCode,
			name,
			description,
			colour: group.colour,
			slug,
			price: priceResolution.value,
			currency: 'EUR',
			imageUrl: imageResolution.value,
			sizes: buildSizesList(group.rows),
			category,
			subcategory,
			sourceSkus: group.rows.map((row) => row['Item']),
		},
		warnings,
	};
}

// --- Mascot (slim CSV distilled by scripts/prepare-mascot-csv.mjs) ---
//
// The slim CSV has one row per size variant with clean ASCII columns:
//   produit, produitQualite, produitQualiteColoris, ean, coloris, taille, nom,
//   prix2026, image1000, type, qualite, texteTechnique
// A product "card" = one product-quality-colour (produitQualiteColoris, e.g.
// 18001-249-010); its sizes are the distinct `taille` values in the group. Category
// is mapped at product level, keyed by `produit` (e.g. 18001). The 2026 price varies
// by size, so we display the minimum (the "à partir de" base price).

export interface MascotProductGroup {
	produit: string;
	produitQualite: string;
	produitQualiteColoris: string;
	rows: PortwestCsvRow[];
}

export function groupMascotRows(rows: PortwestCsvRow[]): MascotProductGroup[] {
	const groups = new Map<string, MascotProductGroup>();
	for (const row of rows) {
		const key = row['produitQualiteColoris'];
		let group = groups.get(key);
		if (!group) {
			group = {
				produit: row['produit'],
				produitQualite: row['produitQualite'],
				produitQualiteColoris: key,
				rows: [],
			};
			groups.set(key, group);
		}
		group.rows.push(row);
	}
	return Array.from(groups.values());
}

export interface BuildMascotProductEntryResult {
	id: string;
	data: Product | null;
	warnings: string[];
}

export function buildMascotEntry(
	group: MascotProductGroup,
	mapping: CategoryMapping,
): BuildMascotProductEntryResult {
	const warnings: string[] = [];
	const firstRow = group.rows[0];
	const name = firstRow['nom'];
	const description = firstRow['texteTechnique'] || firstRow['qualite'] || '';
	const colour = firstRow['coloris'];

	// Prices vary by size; show the lowest ("à partir de"). Comma decimals → dot.
	const prices = group.rows
		.map((row) => Number(row['prix2026'].replace(',', '.')))
		.filter((price) => Number.isFinite(price) && price > 0);
	const price = prices.length > 0 ? Math.min(...prices) : 0;

	const imageUrl = firstRow['image1000'];
	const id = buildEntryId('mascot', group.produitQualiteColoris, colour);
	if (!imageUrl) {
		warnings.push(`no image for produitQualiteColoris=${group.produitQualiteColoris}, product skipped`);
		return { id, data: null, warnings };
	}

	const sizes: string[] = [];
	const seenSizes = new Set<string>();
	for (const row of group.rows) {
		const size = row['taille'];
		if (size && !seenSizes.has(size)) {
			seenSizes.add(size);
			sizes.push(size);
		}
	}

	const { category, subcategory } = resolveCategory(mapping, group.produit);
	const slug = buildProductSlug(name, colour, group.produitQualiteColoris);

	return {
		id,
		data: {
			id,
			supplier: 'mascot',
			styleCode: group.produitQualite,
			name,
			description,
			colour,
			slug,
			price,
			currency: 'EUR',
			imageUrl,
			sizes,
			category,
			subcategory,
			sourceSkus: group.rows.map((row) => row['ean']),
		},
		warnings,
	};
}

// --- Blaklader (FAB-DIS 3.0 export) ---
//
// REFCIALE is always `<12-char base ref><size suffix>` (e.g. "107916451098C44").
// The base ref groups every size/colour of one article and is also the join key
// used by the media export (B03_MEDIA), which is keyed on the base ref alone.
// The size suffix (e.g. "C44", "XS", "4XL") is Blaklader's own size code and is
// used verbatim as the size value, the same way Portwest's `Size` column is used as-is.

const BLAKLADER_BASE_REF_LENGTH = 12;

export function blakladerBaseRef(refciale: string): string {
	return refciale.slice(0, BLAKLADER_BASE_REF_LENGTH);
}

export function blakladerSize(refciale: string): string {
	return refciale.slice(BLAKLADER_BASE_REF_LENGTH);
}

export interface BlakladerProductGroup {
	baseRef: string;
	rows: PortwestCsvRow[];
}

export function groupBlakladerRows(rows: PortwestCsvRow[]): BlakladerProductGroup[] {
	const groups = new Map<string, BlakladerProductGroup>();
	for (const row of rows) {
		const baseRef = blakladerBaseRef(row['REFCIALE']);
		let group = groups.get(baseRef);
		if (!group) {
			group = { baseRef, rows: [] };
			groups.set(baseRef, group);
		}
		group.rows.push(row);
	}
	return Array.from(groups.values());
}

/** Keyed by full REFCIALE (C03_VARIANTE, VCODE=COL rows: one per REFCIALE). */
export function buildBlakladerColourIndex(varianteRows: PortwestCsvRow[]): Map<string, string> {
	const index = new Map<string, string>();
	for (const row of varianteRows) {
		index.set(row['REFCIALE'], row['VARIANTE']);
	}
	return index;
}

/** Keyed by base ref (B03_MEDIA, MTYP=PHOTO rows): picks the lowest-MNUM, highest-resolution photo. */
export function buildBlakladerMediaIndex(mediaRows: PortwestCsvRow[]): Map<string, string> {
	const photosByBaseRef = new Map<string, PortwestCsvRow[]>();
	for (const row of mediaRows) {
		if (row['MTYP'] !== 'PHOTO') {
			continue;
		}
		const baseRef = row['REFCIALE'];
		let photos = photosByBaseRef.get(baseRef);
		if (!photos) {
			photos = [];
			photosByBaseRef.set(baseRef, photos);
		}
		photos.push(row);
	}

	const index = new Map<string, string>();
	for (const [baseRef, photos] of photosByBaseRef) {
		const sorted = [...photos].sort((a, b) => Number(a['MNUM']) - Number(b['MNUM']));
		const best = sorted.find((photo) => !photo['MTEXTE'].includes('basse résolution')) ?? sorted[0];
		index.set(baseRef, best['MURL']);
	}
	return index;
}

export interface BuildBlakladerProductEntryResult {
	id: string;
	data: Product | null;
	warnings: string[];
}

export function buildBlakladerProductEntry(
	group: BlakladerProductGroup,
	colourIndex: Map<string, string>,
	mediaIndex: Map<string, string>,
	mapping: CategoryMapping,
): BuildBlakladerProductEntryResult {
	const warnings: string[] = [];
	const firstRow = group.rows[0];
	const name = firstRow['LIBELLE40'];
	const description = firstRow['LIBELLE240'];

	const colourResolution = resolveDeterministicValue(
		group.rows.map((row) => colourIndex.get(row['REFCIALE']) ?? ''),
	);
	if (colourResolution.hadMismatch) {
		warnings.push(
			`colour mismatch for baseRef=${group.baseRef}: using "${colourResolution.value}", ignored [${colourResolution.ignoredValues.join(', ')}]`,
		);
	}

	const priceResolution = resolveDeterministicValue(
		group.rows.map((row) => Number(row['TARIF'].replace(',', '.'))),
	);
	if (priceResolution.hadMismatch) {
		warnings.push(
			`price mismatch for baseRef=${group.baseRef}: using ${priceResolution.value}, ignored [${priceResolution.ignoredValues.join(', ')}]`,
		);
	}

	const id = buildEntryId('blaklader', group.baseRef, colourResolution.value);

	const imageUrl = mediaIndex.get(group.baseRef);
	if (!imageUrl) {
		warnings.push(`no image found for baseRef=${group.baseRef}, product skipped`);
		return { id, data: null, warnings };
	}

	const sizes: string[] = [];
	const seenSizes = new Set<string>();
	for (const row of group.rows) {
		const size = blakladerSize(row['REFCIALE']);
		if (!seenSizes.has(size)) {
			seenSizes.add(size);
			sizes.push(size);
		}
	}

	const { category, subcategory } = resolveCategory(mapping, group.baseRef);
	const slug = buildProductSlug(name, colourResolution.value, group.baseRef);

	return {
		id,
		data: {
			id,
			supplier: 'blaklader',
			styleCode: group.baseRef,
			name,
			description,
			colour: colourResolution.value,
			slug,
			price: priceResolution.value,
			currency: 'EUR',
			imageUrl,
			sizes,
			category,
			subcategory,
			sourceSkus: group.rows.map((row) => row['REFCIALE']),
		},
		warnings,
	};
}
