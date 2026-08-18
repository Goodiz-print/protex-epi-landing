#!/usr/bin/env node
// One-time, standalone suggestion generator for the Mascot category mapping.
// Run manually: `node scripts/generate-category-mapping-mascot.mjs`
// (must run AFTER `scripts/prepare-mascot-csv.mjs`, which produces the slim CSV.)
// Never run by `astro dev`/`astro build`, and never overwrites a `Numéro de produit`
// that already has a (possibly hand-corrected) entry in the mapping file.
//
// Mascot ships a rich `Type de produit` column ("Veste d'extérieur", "Pantalon",
// "Bottines de sécurité", …); we keyword-match it (normalized) into the site taxonomy
// defined in `src/data/category-taxonomy.ts`. The mapping is keyed at PRODUCT level
// (`Numéro de produit`, e.g. 18001), so one entry covers every quality/colour/size.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SLIM_CSV_PATH = resolve(ROOT, 'src/data/suppliers/mascot/mascot-products.slim.csv');
const MAPPING_PATH = resolve(ROOT, 'src/data/category-mapping.mascot.json');

const UNCLASSIFIED = { category: 'a-trier', subcategory: null };

// Ordered most-specific-first: the first matching rule wins.
// Matched against the normalized `type` (Type de produit) of the product.
const RULES = [
	// --- Pieds (footwear) — order matters: ankle boots before generic shoes/boots. ---
	{ category: 'pieds', subcategory: 'chaussures-hautes', keywords: ['bottine'] },
	{ category: 'pieds', subcategory: 'bottes', keywords: ['botte'] },
	{ category: 'pieds', subcategory: 'chaussures-hautes', keywords: ['chaussures de securite haute'] },
	{ category: 'pieds', subcategory: 'chaussures-basses', keywords: ['chaussure', 'sandale', 'sneaker'] },
	{ category: 'pieds', subcategory: 'accessoires-chaussures', keywords: ['semelle', 'lacet', 'chaussette'] },

	// --- Tête (textile headwear — à revoir, ce ne sont pas des casques de protection). ---
	{ category: 'tete', subcategory: 'protection-tete', keywords: ['bonnet', 'casquette', 'beret', 'chapeau', 'cagoule'] },

	// --- Corps — spécifiques avant la règle générique vêtements. ---
	{ category: 'corps', subcategory: 'vetements-haute-visibilite', keywords: ['circulation', 'haute visibilite', 'hi-vis', 'fluo'] },
	{ category: 'corps', subcategory: 'vetements-pluie', keywords: ['pluie'] },

	// --- Corps — vêtements de travail (le gros du catalogue). ---
	{
		category: 'corps',
		subcategory: 'vetements-travail',
		keywords: [
			'pantalon', 'pantacourt', 'short', 'salopette', 'combinaison', 'veste', 'gilet',
			't-shirt', 'polo', 'sweatshirt', 'sweat', 'pull', 'tricot', 'calecon', 'chemise',
			'blouse', 'jupe', 'jeans', 'parka', 'softshell', 'polaire', 'micropolaire',
			'thermique', 'grand froid',
		],
	},

	// --- Corps — accessoires/composants qui s'attachent à un vêtement de travail Mascot
	// (capuche amovible, genouillères d'insertion, ceinture, poches flottantes...). Ce ne
	// sont pas des vêtements en soi, mais faute de catégorie "accessoires" dédiée dans la
	// taxonomie, on les rattache à leur rayon le plus proche plutôt que de les laisser
	// non classés.
	{
		category: 'corps',
		subcategory: 'vetements-travail',
		keywords: [
			'capuche', 'genouillere', 'tour de cou', 'ceinture', 'porte-badge', 'porte-marteau', 'poche',
		],
	},
];

function normalize(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

function classify(type) {
	const haystack = normalize(type ?? '');
	for (const rule of RULES) {
		if (rule.keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
			return { category: rule.category, subcategory: rule.subcategory };
		}
	}
	return UNCLASSIFIED;
}

function loadExistingMapping() {
	if (!existsSync(MAPPING_PATH)) {
		return {};
	}
	const raw = readFileSync(MAPPING_PATH, 'utf-8').trim();
	return raw ? JSON.parse(raw) : {};
}

function main() {
	const rows = parse(readFileSync(SLIM_CSV_PATH, 'utf-8'), {
		columns: true,
		bom: true,
		trim: true,
		skip_empty_lines: true,
		delimiter: ';',
	});

	// First-seen type per product number.
	const typeByProduct = new Map();
	for (const row of rows) {
		const produit = row['produit'];
		if (produit && !typeByProduct.has(produit)) {
			typeByProduct.set(produit, row['type'] ?? '');
		}
	}

	const mapping = loadExistingMapping();
	const alreadyMappedCount = Object.keys(mapping).length;
	let addedCount = 0;
	const perCategoryCount = new Map();
	const unmatchedTypes = new Map();

	for (const [produit, type] of typeByProduct) {
		if (produit in mapping) {
			continue;
		}
		const result = classify(type);
		mapping[produit] = result;
		addedCount += 1;
		perCategoryCount.set(result.category, (perCategoryCount.get(result.category) ?? 0) + 1);
		if (result.category === 'a-trier') {
			unmatchedTypes.set(type.trim(), (unmatchedTypes.get(type.trim()) ?? 0) + 1);
		}
	}

	const sortedMapping = Object.fromEntries(
		Object.keys(mapping)
			.sort()
			.map((produit) => [produit, mapping[produit]]),
	);

	writeFileSync(MAPPING_PATH, `${JSON.stringify(sortedMapping, null, 2)}\n`, 'utf-8');

	console.log(`Total unique product numbers in slim CSV: ${typeByProduct.size}`);
	console.log(`Already mapped (untouched): ${alreadyMappedCount}`);
	console.log(`Newly classified this run: ${addedCount}`);
	console.log('Breakdown of newly classified entries by category:');
	for (const [category, count] of [...perCategoryCount.entries()].sort((a, b) => b[1] - a[1])) {
		console.log(`  - ${category}: ${count}`);
	}
	if (unmatchedTypes.size > 0) {
		console.log("\n'Type de produit' values sent to 'a-trier' (add a RULES entry to reclassify):");
		for (const [type, count] of [...unmatchedTypes.entries()].sort((a, b) => b[1] - a[1])) {
			console.log(`  - ${count}x  ${type}`);
		}
	}
	console.log(`\nWritten to ${MAPPING_PATH}`);
}

main();
