#!/usr/bin/env node
// One-time, standalone suggestion generator for the Blaklader category mapping.
// Run manually: `node scripts/generate-category-mapping-blaklader.mjs`
// Never run by `astro dev`/`astro build`, and never overwrites a baseRef
// that already has a (possibly hand-corrected) entry in the mapping file.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CSV_PATH = resolve(
	ROOT,
	'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B01_COMMERCE.csv',
);
const MAPPING_PATH = resolve(ROOT, 'src/data/category-mapping.blaklader.json');

const BASE_REF_LENGTH = 12;

const UNCLASSIFIED = { category: 'a-trier', subcategory: null };

// Ordered most-specific-first: the first matching rule wins.
// Matched against the normalized "FAM1L FAM2L" pair from B01_COMMERCE.
const RULES = [
	{ category: 'mains', subcategory: 'gants-protection', keywords: ['gant'] },
	{ category: 'pieds', subcategory: 'accessoires-chaussures', keywords: ['socks', 'chaussette'] },

	// Clothing line/collection overrides (checked before the generic garment-type rule below).
	{ category: 'corps', subcategory: 'vetements-haute-visibilite', keywords: ['high vis', 'hi-vis', 'fluo'] },
	{ category: 'corps', subcategory: 'vetements-pluie', keywords: ["vent/pluie/neige", 'vetements de pluie'] },

	// Generic garment types.
	{
		category: 'corps',
		subcategory: 'vetements-travail',
		keywords: [
			'pantalon', 'veste', 'tee shirt', 'sweatershirt', 'short', 'cotte a bretelles',
			'combinaison', 'gilet', 'polo', 'chemise', 'blouse', 'pirate trousers',
			'underwear', 'skirt', 'kilt',
		],
	},
];

function normalize(text) {
	return text
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

function classify(fam1l, fam2l) {
	const haystack = normalize(`${fam1l} ${fam2l}`);
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

	const firstSeenByBaseRef = new Map();
	for (const row of rows) {
		const baseRef = row['REFCIALE'].slice(0, BASE_REF_LENGTH);
		if (!firstSeenByBaseRef.has(baseRef)) {
			firstSeenByBaseRef.set(baseRef, { fam1l: row['FAM1L'], fam2l: row['FAM2L'] });
		}
	}

	const mapping = loadExistingMapping();
	const alreadyMappedCount = Object.keys(mapping).length;
	let addedCount = 0;
	const perCategoryCount = new Map();
	const unmatchedPairs = new Map();

	for (const [baseRef, { fam1l, fam2l }] of firstSeenByBaseRef) {
		if (baseRef in mapping) {
			continue;
		}
		const result = classify(fam1l, fam2l);
		mapping[baseRef] = result;
		addedCount += 1;
		perCategoryCount.set(result.category, (perCategoryCount.get(result.category) ?? 0) + 1);
		if (result.category === 'a-trier') {
			const pairKey = `${fam1l.trim()} | ${fam2l.trim()}`;
			unmatchedPairs.set(pairKey, (unmatchedPairs.get(pairKey) ?? 0) + 1);
		}
	}

	const sortedMapping = Object.fromEntries(
		Object.keys(mapping)
			.sort()
			.map((baseRef) => [baseRef, mapping[baseRef]]),
	);

	writeFileSync(MAPPING_PATH, `${JSON.stringify(sortedMapping, null, 2)}\n`, 'utf-8');

	console.log(`Total unique base refs in CSV: ${firstSeenByBaseRef.size}`);
	console.log(`Already mapped (untouched): ${alreadyMappedCount}`);
	console.log(`Newly classified this run: ${addedCount}`);
	console.log('Breakdown of newly classified entries by category:');
	for (const [category, count] of [...perCategoryCount.entries()].sort((a, b) => b[1] - a[1])) {
		console.log(`  - ${category}: ${count}`);
	}
	if (unmatchedPairs.size > 0) {
		console.log("\nFAM1L/FAM2L pairs sent to 'a-trier' (add a RULES entry to reclassify):");
		for (const [pair, count] of [...unmatchedPairs.entries()].sort((a, b) => b[1] - a[1])) {
			console.log(`  - ${count}x  ${pair}`);
		}
	}
	console.log(`\nWritten to ${MAPPING_PATH}`);
}

main();
