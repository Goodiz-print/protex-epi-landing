#!/usr/bin/env node
// One-time preprocessing for the Mascot supplier.
//
// The Mascot "extended" export (`MASCOT_extended_productdata_FR.csv`) is ~291 MB and
// holds 96 columns — far too big to parse on every `astro dev`/`astro build` and too
// big to commit. This script distills it into a slim, committable CSV that carries
// only the columns the catalog loader needs, and joins the 2026 price + clean
// commercial name from `Produits-Table 1.csv` on the EAN (the only reliable per-row
// join key: the article-code coloris width differs between the two files).
//
// Run manually: `node scripts/prepare-mascot-csv.mjs`
// Never run by astro dev/build. Rerun whenever Mascot ships a new export.
//
// Notes:
// - Both Mascot files are UTF-8, semicolon-delimited, with comma decimals ("47,95").
// - Several extended headers ("Images produit 1 000 px", …) use non-breaking spaces
//   (U+00A0); we normalize them to regular spaces so columns can be referenced plainly.
// - The extended file is read as a STREAM so we never hold all 96 columns of 41k rows
//   in memory at once; only the ~12 slim columns are kept.

import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse';
import { parse as parseSync } from 'csv-parse/sync';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MASCOT_DIR = resolve(ROOT, 'src/data/suppliers/mascot');
const EXTENDED_PATH = resolve(MASCOT_DIR, 'MASCOT_extended_productdata_FR.csv');
const PRODUITS_PATH = resolve(MASCOT_DIR, 'Produits-Table 1.csv');
const OUT_PATH = resolve(MASCOT_DIR, 'mascot-products.slim.csv');

const NBSP = String.fromCharCode(0xa0);

const SLIM_COLUMNS = [
	'produit', // Numéro de produit (18001) — category-mapping key (product level)
	'produitQualite', // Numéro de produit-qualité (18001-249) — styleCode / reference
	'produitQualiteColoris', // Numéro de produit-qualité-coloris (18001-249-010) — grouping key (1 card)
	'ean', // Numéro EAN — per-size SKU + join key
	'coloris', // Coloris (Marine foncé)
	'taille', // Taille UE
	'nom', // NOM DE PRODUIT (Produits-Table, joined by EAN) — clean commercial name
	'prix2026', // NEW - PRIX 2026 BRUT H.T. (Produits-Table, joined by EAN), comma decimal
	'image1000', // first URL from "Images produit 1 000 px" (pimage.mascot.fr)
	'type', // Type de produit (Veste d'extérieur, Pantalon, …) — classification input
	'qualite', // Qualité (composition, e.g. "100% polyester, 185 g/m²")
	'texteTechnique', // Texte technique — product description
];

// Header name after NBSP → regular-space normalization.
const IMAGE_1000_COL = 'Images produit 1 000 px';

/** First http(s) URL found in a possibly multi-value / multi-line cell. */
function firstUrl(value) {
	const match = String(value ?? '').match(/https?:\/\/[^\s;"]+/);
	return match ? match[0] : '';
}

// Mascot product photos are hosted on pimage.mascot.fr with a deterministic name
// derived from the product-quality-colour code, e.g. 18001-249-010 →
// https://pimage.mascot.fr/18001-249-010_P01_1000pxweb.jpg. Used as a fallback when
// the export's image column is empty.
function constructedImageUrl(produitQualiteColoris) {
	return produitQualiteColoris
		? `https://pimage.mascot.fr/${produitQualiteColoris}_P01_1000pxweb.jpg`
		: '';
}

function csvEscape(value) {
	const s = String(value ?? '');
	if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

/** Index { name, price2026 } by EAN from the clean, small Produits-Table file. */
function buildProduitsIndex() {
	const content = readFileSync(PRODUITS_PATH, 'utf-8');
	const rows = parseSync(content, {
		columns: true,
		bom: true,
		trim: true,
		skip_empty_lines: true,
		delimiter: ';',
	});
	const byEan = new Map();
	for (const row of rows) {
		const ean = row['CODE EAN'];
		if (!ean) {
			continue;
		}
		byEan.set(ean, {
			name: row['NOM DE PRODUIT'] ?? '',
			price2026: row['NEW - PRIX 2026 BRUT H.T.'] ?? '',
		});
	}
	return byEan;
}

async function main() {
	const produitsIndex = buildProduitsIndex();
	console.log(`Produits-Table: ${produitsIndex.size} EANs indexed (price 2026 + name).`);

	const parser = createReadStream(EXTENDED_PATH).pipe(
		parse({
			columns: (header) => header.map((name) => name.split(NBSP).join(' ')),
			bom: true,
			trim: true,
			skip_empty_lines: true,
			delimiter: ';',
			relax_column_count: true,
		}),
	);

	const lines = [SLIM_COLUMNS.join(';')];
	const cards = new Set();
	let rowCount = 0;
	let priceJoined = 0;
	let imageFromColumn = 0;
	let imageConstructed = 0;

	for await (const row of parser) {
		rowCount += 1;
		const ean = row['Numéro EAN'] ?? '';
		const joined = produitsIndex.get(ean);
		if (joined) {
			priceJoined += 1;
		}

		const produitQualiteColoris = row['Numéro de produit-qualité-coloris'] ?? '';
		cards.add(produitQualiteColoris);

		let image1000 = firstUrl(row[IMAGE_1000_COL]);
		if (image1000) {
			imageFromColumn += 1;
		} else {
			image1000 = constructedImageUrl(produitQualiteColoris);
			if (image1000) {
				imageConstructed += 1;
			}
		}

		const slim = {
			produit: row['Numéro de produit'] ?? '',
			produitQualite: row['Numéro de produit-qualité'] ?? '',
			produitQualiteColoris,
			ean,
			coloris: row['Coloris'] ?? '',
			taille: row['Taille UE'] ?? '',
			nom: joined?.name || row['Nom du produit (ancien)'] || '',
			prix2026: joined?.price2026 || row['Prix'] || '',
			image1000,
			type: row['Type de produit'] ?? '',
			qualite: row['Qualité'] ?? '',
			texteTechnique: row['Texte technique'] ?? '',
		};
		lines.push(SLIM_COLUMNS.map((col) => csvEscape(slim[col])).join(';'));
	}

	writeFileSync(OUT_PATH, `${lines.join('\n')}\n`, 'utf-8');

	console.log(`Extended rows read: ${rowCount}`);
	console.log(`Distinct product-quality-colour cards: ${cards.size}`);
	console.log(`Rows with a 2026 price joined by EAN: ${priceJoined} (${Math.round((priceJoined / rowCount) * 100)}%)`);
	console.log(`Images from column: ${imageFromColumn}, constructed as fallback: ${imageConstructed}`);
	console.log(`Written slim CSV → ${OUT_PATH}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
