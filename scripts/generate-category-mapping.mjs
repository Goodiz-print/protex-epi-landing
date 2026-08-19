#!/usr/bin/env node
// One-time, standalone suggestion generator for the Portwest category mapping.
// Run manually: `node scripts/generate-category-mapping.mjs`
// Never run by `astro dev`/`astro build`, and never overwrites a styleCode
// that already has a (possibly hand-corrected) entry in the mapping file —
// entries currently classified as 'a-trier' are the exception: those are
// re-evaluated against the current RULES on every run.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(ROOT, 'src/data/suppliers/portwest/product_sheet_FR_A8_20.csv');
const MAPPING_PATH = resolve(ROOT, 'src/data/category-mapping.portwest.json');

const UNCLASSIFIED = { category: 'a-trier', subcategory: null };

// Ordered most-specific-first: the first matching rule wins.
const RULES = [
	// MAINS
	{ category: 'mains', subcategory: 'outils-coupe', keywords: ['cutter', 'couteau', 'lame de securite', 'outil de coupe'] },
	{ category: 'mains', subcategory: 'hygiene-sante', keywords: ['hygiene', 'gel hydroalcoolique', 'savon', 'creme', 'pommade', 'secours', 'secourisme', 'lingette'] },
	{ category: 'mains', subcategory: 'gants-protection', keywords: ['gant', 'glove', 'glv', 'gauntlet', 'manchette', 'mitaine'] },

	// TETE (order matters: ouie/yeux/respiratoire before generic casque)
	{ category: 'tete', subcategory: 'protection-ouie', keywords: ["bouchon d'oreille", 'bouchon auditif', 'anti-bruit', 'casque anti-bruit', 'protection auditive', 'bouchons', 'ear plug'] },
	{ category: 'tete', subcategory: 'protection-yeux', keywords: ['lunette', 'visiere', 'ecran facial', 'surlunette', 'visor', 'eye-shield', 'eye shield', 'goggle', 'glasses'] },
	{ category: 'tete', subcategory: 'protection-respiratoire', keywords: ['masque', 'respiratoire', 'ffp1', 'ffp2', 'ffp3', 'cartouche filtrante', 'demi-masque'] },
	{ category: 'tete', subcategory: 'protection-tete', keywords: ['casque', 'casquette anti-heurt', 'bump cap', 'helmet', 'bonnet', 'beanie', 'cagoule', 'balaclava', 'chapka', 'bandeau', 'trucker cap', 'chapeau', 'echarpe', 'hijab', 'tour de cou', 'serre-tete'] },

	// CORPS
	{ category: 'corps', subcategory: 'vetements-haute-visibilite', keywords: ['haute visibilite', 'hi-vis', 'fluo'] },
	{ category: 'corps', subcategory: 'vetements-pluie', keywords: ['pluie', 'impermeable', 'k-way', 'cire', 'rain'] },
	{
		category: 'corps',
		subcategory: 'equipement-antichute',
		keywords: [
			'harnais', 'antichute', 'longe', 'ligne de vie', "point d'ancrage", 'mousqueton',
			'laniere', 'sangle', 'lifeline', 'elingue', 'crochet de securite', 'absorbeur de choc',
		],
	},
	{
		category: 'corps',
		subcategory: 'vetements-travail',
		keywords: [
			'veste', 'pantalon', 'blouse', 'combinaison', 'gilet', 'polaire', 'chemise',
			'tablier', 'bleu de travail', 'salopette', 'short', 'sweat', 'polo', 't-shirt',
			'doudoune', 'parka', 'bermuda', 'cotte', 'bretelles', 'jogging', 'jogger',
			'legging', 'blouson', 'softshell', 'bodywarmer', 'tunique', 'manteau',
			'trouser', 'jacket', 'coat', 'sous-vetement', 'sous vetement', 'base layer',
			'thermique', 'pull', 'henley', 'chasuble', 'tee shirt', 'tee-shirt',
			'ceinture', 'support belt', 'genouillere', 'coudiere',
		],
	},

	// PIEDS (specific before generic)
	{ category: 'pieds', subcategory: 'accessoires-chaussures', keywords: ['lacet', 'semelle', 'sur-chaussure', 'guetre', 'chaussette', 'sock'] },
	{ category: 'pieds', subcategory: 'bottes', keywords: ['botte', 'boot', 'waders', 'cuissarde', 'rigger', 'wellington'] },
	{ category: 'pieds', subcategory: 'chaussures-hautes', keywords: ['chaussure haute', 'brodequin', 'montante'] },
	{
		category: 'pieds',
		subcategory: 'chaussures-basses',
		keywords: ['chaussure basse', 'basket de securite', 'chaussure', 'basket', 'sandale', 'sandal', 'mocassin', 'sabot', 'trainer'],
	},

	// USAGE UNIQUE
	{ category: 'usage-unique', subcategory: null, keywords: ['jetable', 'usage unique', 'non tisse'] },
];

function normalize(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

function classify(product, description) {
	const haystack = normalize(`${product} ${description}`);
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
	const csvContent = readFileSync(CSV_PATH, 'utf-8');
	const rows = parse(csvContent, { columns: true, bom: true, trim: true, skip_empty_lines: true });

	// Prefer the first row with a non-empty Product/Description over the strictly-first
	// row: some style codes' first CSV row is a bare variant with no text, while a later
	// row for the same style code carries the actual product name/description.
	const firstSeenByStyleCode = new Map();
	for (const row of rows) {
		const styleCode = row['Style Code'];
		const hasText = Boolean(row['Product']?.trim() || row['Description']?.trim());
		const existing = firstSeenByStyleCode.get(styleCode);
		if (!existing || (!existing.hasText && hasText)) {
			firstSeenByStyleCode.set(styleCode, { product: row['Product'], description: row['Description'], hasText });
		}
	}

	const mapping = loadExistingMapping();
	const alreadyMappedCount = Object.keys(mapping).length;
	let addedCount = 0;
	let reclassifiedCount = 0;
	const perCategoryCount = new Map();

	for (const [styleCode, { product, description }] of firstSeenByStyleCode) {
		const existing = mapping[styleCode];
		const existingCategory = typeof existing === 'string' ? existing : existing?.category;
		if (existing && existingCategory !== 'a-trier') {
			continue;
		}
		const result = classify(product, description);
		mapping[styleCode] = result;
		if (existing) {
			if (result.category !== 'a-trier') reclassifiedCount += 1;
		} else {
			addedCount += 1;
		}
		perCategoryCount.set(result.category, (perCategoryCount.get(result.category) ?? 0) + 1);
	}

	const sortedMapping = Object.fromEntries(
		Object.keys(mapping)
			.sort()
			.map((styleCode) => [styleCode, mapping[styleCode]]),
	);

	writeFileSync(MAPPING_PATH, `${JSON.stringify(sortedMapping, null, 2)}\n`, 'utf-8');

	console.log(`Total unique Style Codes in CSV: ${firstSeenByStyleCode.size}`);
	console.log(`Already mapped (untouched): ${alreadyMappedCount - reclassifiedCount}`);
	console.log(`Newly classified this run: ${addedCount}`);
	console.log(`Reclassified out of 'a-trier' this run: ${reclassifiedCount}`);
	console.log('Breakdown of newly classified entries by category:');
	for (const [category, count] of [...perCategoryCount.entries()].sort((a, b) => b[1] - a[1])) {
		console.log(`  - ${category}: ${count}`);
	}
	console.log(`Written to ${MAPPING_PATH}`);
}

main();
