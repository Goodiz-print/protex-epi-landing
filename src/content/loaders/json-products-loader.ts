import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';
import type { Product } from '../schemas/product.ts';

// Reads the pre-computed catalog data written by `scripts/generate-catalog-data.mjs`.
// All the CSV parsing, joining and category mapping happens in that script, manually,
// so a build only ever reads a compact JSON array of ready-made `Product` objects.

export interface JsonProductSource {
	supplier: 'portwest' | 'mascot' | 'blaklader';
	/** e.g. `src/data/catalog/products.portwest.json`, relative to the project root. */
	jsonPath: string;
}

export interface JsonProductsLoaderOptions {
	sources: JsonProductSource[];
}

async function runSync(options: JsonProductsLoaderOptions, context: LoaderContext, watchedPaths: Set<string>) {
	const { store, config, logger, parseData, generateDigest } = context;
	const rootPath = fileURLToPath(config.root);

	store.clear();

	for (const source of options.sources) {
		const jsonAbsPath = resolve(rootPath, source.jsonPath);
		watchedPaths.add(jsonAbsPath);

		const products: Product[] = JSON.parse(readFileSync(jsonAbsPath, 'utf-8'));

		for (const product of products) {
			const parsedData = await parseData({ id: product.id, data: product });
			store.set({ id: product.id, data: parsedData, digest: generateDigest(parsedData) });
		}

		logger.info(`[${source.supplier}] loaded ${products.length} products (${jsonAbsPath})`);
	}
}

export function jsonProductsLoader(options: JsonProductsLoaderOptions): Loader {
	const watchedPaths = new Set<string>();

	return {
		name: 'json-products-loader',
		load: async (context: LoaderContext) => {
			await runSync(options, context, watchedPaths);

			const { watcher, logger } = context;
			if (!watcher) {
				return;
			}
			const onChange = async (changedPath: string) => {
				if (!watchedPaths.has(changedPath)) {
					return;
				}
				try {
					await runSync(options, context, watchedPaths);
					logger.info(`Reloaded products after change to ${changedPath}`);
				} catch (error) {
					logger.error(`Failed to reload products after change to ${changedPath}: ${(error as Error).message}`);
				}
			};
			watcher.on('change', onChange);
			for (const watchedPath of watchedPaths) {
				watcher.add(watchedPath);
			}
		},
	};
}
