// Unit tests for scripts/lib/complete-products.mjs — run with `pnpm test`.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { completeProducts } from '../scripts/lib/complete-products.mjs';

/** Minimal Portwest catalog product; `code` is the 3-char SKU colour code. */
function portwest(styleCode, code, fields = {}) {
	const colour = fields.colour ?? '';
	return {
		id: `portwest:${styleCode}:${code.toLowerCase()}`,
		slug: `${styleCode.toLowerCase()}-${code.toLowerCase()}`,
		styleCode,
		name: '',
		colour,
		description: '',
		sizes: ['M'],
		sourceSkus: [`${styleCode}${code}M`],
		...fields,
	};
}

describe('completeProducts', () => {
	it('names an unlabelled colourway from its model and its colour from the SKU code', () => {
		const named = portwest('FT45', 'BKR', {
			id: 'portwest:FT45:noir',
			slug: 'chaussure-noir-ft45',
			name: 'Chaussure',
			colour: 'Noir',
			description: 'Une chaussure.',
		});
		const other = portwest('S100', 'RER', { id: 'portwest:S100:rouge', name: 'Veste', colour: 'Rouge' });
		const blank = portwest('FT45', 'RER');
		const { products, report } = completeProducts('portwest', [named, other, blank]);

		assert.equal(report.named, 1);
		assert.deepEqual(
			{ id: blank.id, slug: blank.slug, name: blank.name, colour: blank.colour, description: blank.description },
			{
				id: 'portwest:FT45:rouge',
				slug: 'chaussure-rouge-ft45',
				name: 'Chaussure',
				colour: 'Rouge',
				description: 'Une chaussure.',
			},
		);
		assert.equal(products.length, 3);
	});

	it('merges an unlabelled colourway into the existing colourway of the same colour', () => {
		const named = portwest('FT45', 'BKR', {
			id: 'portwest:FT45:noir',
			name: 'Chaussure',
			colour: 'Noir',
			sizes: ['L', 'S'],
		});
		const blank = portwest('FT45', 'BKR', { sizes: ['XL', 'M'], sourceSkus: ['FT45BKRXL'] });
		const { products, report } = completeProducts('portwest', [named, blank]);

		assert.equal(report.merged, 1);
		assert.equal(products.length, 1);
		assert.deepEqual(products[0].sizes, ['S', 'M', 'L', 'XL']);
		assert.deepEqual(products[0].sourceSkus, ['FT45BKRM', 'FT45BKRXL']);
	});

	it('names a whole reference from an override, including a colour code nothing else names', () => {
		const blank = portwest('ZZ01', 'AQR');
		const overrides = { ZZ01: { name: 'Gilet', description: 'Un gilet.', colours: { AQR: 'Aqua' } } };
		const { report } = completeProducts('portwest', [blank], overrides);

		assert.equal(report.named, 1);
		assert.equal(blank.name, 'Gilet');
		assert.equal(blank.colour, 'Aqua');
		assert.equal(blank.id, 'portwest:ZZ01:aqua');
		assert.equal(blank.slug, 'gilet-aqua-zz01');
	});

	it('lets an override rename a named product and fix its colour', () => {
		const product = portwest('S100', 'NAR', {
			id: 'portwest:S100:navy',
			name: 'Work Jacket',
			colour: 'Navy',
			description: 'Old text',
		});
		const overrides = { S100: { name: 'Veste de travail', description: 'Nouveau texte', colours: { NAR: 'Marine' } } };
		const { report } = completeProducts('portwest', [product], overrides);

		assert.equal(report.renamed, 1);
		assert.equal(product.name, 'Veste de travail');
		assert.equal(product.description, 'Nouveau texte');
		assert.equal(product.colour, 'Marine');
		assert.equal(product.id, 'portwest:S100:marine');
		assert.equal(product.slug, 'veste-de-travail-marine-s100');
	});

	it('normalises entities, whitespace and the colour labels the export truncates', () => {
		const truncated = portwest('S100', 'OBR', {
			id: 'portwest:S100:orange-noir-shor',
			name: 'Veste&nbsp;de   travail ',
			colour: 'Orange/Noir Shor',
			description: 'Texte  &amp; suite',
		});
		const garbled = portwest('S200', 'NVS', { id: 'portwest:S200:navy-nv-s', name: 'Veste', colour: 'Navy NV S' });
		const { report } = completeProducts('portwest', [truncated, garbled]);

		assert.equal(report.normalised, 2);
		assert.equal(truncated.name, 'Veste de travail');
		assert.equal(truncated.colour, 'Orange/Noir Short');
		assert.equal(truncated.description, 'Texte & suite');
		assert.equal(truncated.id, 'portwest:S100:orange-noir-short');
		assert.equal(garbled.colour, 'Marine Short');
	});

	it('keeps the Mascot id key (produit-qualité-coloris) when renaming', () => {
		const product = {
			id: 'mascot:24150-M99-09:noir',
			slug: 'old-noir-24150-m99-09',
			styleCode: '24150-M99',
			name: '',
			colour: 'Noir',
			description: '',
			sizes: ['M'],
			sourceSkus: ['24150-M99-09-M'],
		};
		const { report } = completeProducts('mascot', [product], { '24150-M99': { name: 'Pantalon' } });

		assert.equal(report.named, 1);
		assert.equal(product.id, 'mascot:24150-M99-09:noir');
		assert.equal(product.slug, 'pantalon-noir-24150-m99-09');
	});

	it('reports the overrides that match no product', () => {
		const product = portwest('S100', 'NAR', { id: 'portwest:S100:marine', name: 'Veste', colour: 'Marine' });
		const { report } = completeProducts('portwest', [product], { S100: { name: 'Veste' }, GONE: { name: 'X' } });

		assert.deepEqual(report.unmatchedOverrides, ['GONE']);
	});

	it('leaves a row it cannot name untouched', () => {
		const blank = portwest('ZZ99', 'QQQ');
		const before = structuredClone(blank);
		const { products, report } = completeProducts('portwest', [blank]);

		assert.deepEqual(products, [before]);
		assert.equal(report.named, 0);
	});

	it('reports a colour code it cannot resolve on a named product', () => {
		const product = portwest('S100', 'QQQ', { id: 'portwest:S100:', name: 'Veste' });
		const { report } = completeProducts('portwest', [product]);

		assert.equal(product.colour, '');
		assert.deepEqual(report.unknownColourCodes, ['S100QQQ']);
	});

	it('is idempotent: a second run changes nothing', () => {
		const build = () => [
			portwest('FT45', 'BKR', { id: 'portwest:FT45:noir', name: 'Chaussure', colour: 'Noir' }),
			portwest('FT45', 'BKR', { sizes: ['XL'], sourceSkus: ['FT45BKRXL'] }),
			portwest('FT45', 'RER'),
			portwest('S100', 'RER', { id: 'portwest:S100:rouge', name: 'Veste&nbsp;', colour: 'Rouge Shor' }),
			portwest('ZZ01', 'AQR'),
		];
		const overrides = { ZZ01: { name: 'Gilet', colours: { AQR: 'Aqua' } } };
		const first = completeProducts('portwest', build(), overrides).products;
		const snapshot = structuredClone(first);
		const second = completeProducts('portwest', first, overrides);

		assert.deepEqual(second.products, snapshot);
		const { named, renamed, coloured, normalised, merged } = second.report;
		assert.deepEqual(
			{ named, renamed, coloured, normalised, merged },
			{
				named: 0,
				renamed: 0,
				coloured: 0,
				normalised: 0,
				merged: 0,
			},
		);
	});
});
