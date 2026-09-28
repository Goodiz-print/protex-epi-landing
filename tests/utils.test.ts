// Unit tests for the pure helpers shared by the site and the catalog scripts — run with `pnpm test`.
// Only modules without the `~/` alias can be imported here (Node resolves plain relative paths).

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildEntryId, buildProductSlug } from '../scripts/lib/supplier-csv.ts';
import { hasProductImage, isIncompleteProduct, PLACEHOLDER_IMAGE_URL } from '../src/utils/product-image.ts';
import { formatSizeRange } from '../src/utils/sizes.ts';
import { slugify } from '../src/utils/slugify.ts';

describe('slugify', () => {
	it('strips accents, lowercases and joins words with dashes', () => {
		assert.equal(slugify('Chaussure Sécurité'), 'chaussure-securite');
		assert.equal(slugify('Orange/Noir Short'), 'orange-noir-short');
		assert.equal(slugify('  Hygiène & Santé  '), 'hygiene-sante');
		assert.equal(slugify('24150-M99'), '24150-m99');
	});
});

describe('buildEntryId / buildProductSlug', () => {
	it('builds the id from supplier, key and slugified colour', () => {
		assert.equal(buildEntryId('portwest', 'FT45', 'Noir/Gris'), 'portwest:FT45:noir-gris');
	});

	it('builds the slug from name, colour and key', () => {
		assert.equal(buildProductSlug('Veste de travail', 'Marine', 'S100'), 'veste-de-travail-marine-s100');
	});
});

describe('formatSizeRange', () => {
	it('returns null for no size and the size itself for one', () => {
		assert.equal(formatSizeRange([]), null);
		assert.equal(formatSizeRange([' ', '']), null);
		assert.equal(formatSizeRange(['M']), 'M');
	});

	it('orders letter sizes by garment order', () => {
		assert.equal(formatSizeRange(['XL', 'S', '3XL', 'M']), 'S - 3XL');
	});

	it('orders numeric sizes by value', () => {
		assert.equal(formatSizeRange(['44', '38', '47', '39']), '38 - 47');
		assert.equal(formatSizeRange(['C50', 'C46', 'C62']), 'C46 - C62');
	});

	it('falls back to first and last for mixed lists', () => {
		assert.equal(formatSizeRange(['Unique', 'M']), 'Unique - M');
	});
});

describe('product visibility', () => {
	const product = {
		imageUrl: 'https://cdn.example/photo.jpg',
		price: 12.5,
		name: 'Veste',
		colour: 'Marine',
		description: 'Une veste.',
	};

	it('publishes a product with a photo or a price', () => {
		assert.equal(isIncompleteProduct(product), false);
		assert.equal(isIncompleteProduct({ ...product, imageUrl: PLACEHOLDER_IMAGE_URL }), false);
		assert.equal(isIncompleteProduct({ ...product, price: 0 }), false);
	});

	it('hides a product with neither photo nor price', () => {
		assert.equal(isIncompleteProduct({ ...product, imageUrl: PLACEHOLDER_IMAGE_URL, price: 0 }), true);
	});

	it('hides a blank price-list row', () => {
		assert.equal(isIncompleteProduct({ ...product, name: ' ', colour: '', description: '' }), true);
	});

	it('detects the placeholder image', () => {
		assert.equal(hasProductImage(product), true);
		assert.equal(hasProductImage({ imageUrl: PLACEHOLDER_IMAGE_URL }), false);
	});
});
