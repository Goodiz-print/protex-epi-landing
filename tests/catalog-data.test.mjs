// Integrity checks on the committed catalog data (src/data/catalog/products.<supplier>.json and
// the override files) — run with `pnpm test`. They catch what a hand edit or a partial script
// run can leave behind: duplicate URLs, unknown categories, overrides not applied.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { completeProducts, readProductOverrides } from '../scripts/lib/complete-products.mjs';
import { categoryTaxonomy } from '../src/data/category-taxonomy.ts';
import { isIncompleteProduct } from '../src/utils/product-image.ts';

const SUPPLIERS = ['portwest', 'mascot', 'blaklader'];
const readJson = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf-8'));
const withoutComments = (object) => Object.fromEntries(Object.entries(object).filter(([key]) => !key.startsWith('_')));

/** Same key as mappingKey() in scripts/reclassify-catalog.mjs. */
const mappingKey = (supplier, product) => (supplier === 'mascot' ? product.styleCode.split('-')[0] : product.styleCode);

function duplicates(values) {
	const seen = new Set();
	return [...new Set(values.filter((value) => seen.size === seen.add(value).size))];
}

for (const supplier of SUPPLIERS) {
	describe(`catalog ${supplier}`, () => {
		const products = readJson(`src/data/catalog/products.${supplier}.json`);

		it('has products', () => {
			assert.ok(products.length > 0);
		});

		it('has unique ids and slugs', () => {
			assert.deepEqual(duplicates(products.map((product) => product.id)), [], 'duplicate ids');
			assert.deepEqual(duplicates(products.map((product) => product.slug)), [], 'duplicate slugs');
		});

		it('only uses categories and subcategories of the taxonomy', () => {
			const invalid = products
				.filter((product) => {
					const category = categoryTaxonomy.find((entry) => entry.slug === product.category);
					if (!category) return true;
					if (product.subcategory === null) return category.subcategories.length > 0;
					return !category.subcategories.some((entry) => entry.slug === product.subcategory);
				})
				.map((product) => `${product.id} → ${product.category}/${product.subcategory}`);
			assert.deepEqual(invalid, []);
		});

		it('publishes no product without a name', () => {
			const nameless = products.filter((product) => !isIncompleteProduct(product) && !product.name.trim());
			assert.deepEqual(
				nameless.map((product) => product.id),
				[],
			);
		});

		it('is up to date with its product overrides (run `pnpm run complete:catalog`)', () => {
			const overrides = readProductOverrides(
				new URL(`../src/data/product-overrides.${supplier}.json`, import.meta.url).pathname,
			);
			const snapshot = structuredClone(products);
			const { products: completed, report } = completeProducts(supplier, structuredClone(products), overrides);
			assert.deepEqual(report.unmatchedOverrides, [], 'overrides matching no product');
			assert.deepEqual(completed, snapshot);
		});

		it('is up to date with its category overrides (run `pnpm run reclassify:catalog`)', () => {
			const overrides = withoutComments(readJson(`src/data/category-overrides.${supplier}.json`));
			const keys = new Set(products.map((product) => mappingKey(supplier, product)));
			assert.deepEqual(
				Object.keys(overrides).filter((key) => !keys.has(key)),
				[],
				'overrides matching no product',
			);
			const stale = products
				.filter((product) => {
					const override = overrides[mappingKey(supplier, product)];
					return override && (override.category !== product.category || override.subcategory !== product.subcategory);
				})
				.map((product) => product.id);
			assert.deepEqual(stale, []);
		});

		it('reports the products left to review', (t) => {
			const published = products.filter((product) => !isIncompleteProduct(product));
			const unsorted = published.filter((product) => product.category === 'a-trier');
			const free = published.filter((product) => !(product.price > 0));
			// Informative only: a new supplier export legitimately brings some before the review.
			if (unsorted.length > 0) t.diagnostic(`${unsorted.length} published product(s) still in a-trier`);
			if (free.length > 0) {
				const styles = [...new Set(free.map((product) => product.styleCode))];
				t.diagnostic(`${free.length} published product(s) priced 0: ${styles.join(', ')}`);
			}
		});
	});
}
