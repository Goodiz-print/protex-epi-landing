import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Loader, LoaderContext } from 'astro/loaders';
import type { Product } from '../schemas/product';

export interface JsonProductsLoaderOptions {
	paths: string[];
}

async function runSync(options: JsonProductsLoaderOptions, context: LoaderContext) {
	const { store, config, logger, parseData, generateDigest } = context;
	const rootPath = fileURLToPath(config.root);

	store.clear();

	for (const path of options.paths) {
		const absPath = resolve(rootPath, path);
		const products: Product[] = JSON.parse(readFileSync(absPath, 'utf-8'));

		for (const product of products) {
			const parsedData = await parseData({ id: product.id, data: product });
			store.set({ id: product.id, data: parsedData, digest: generateDigest(parsedData) });
		}

		logger.info(`loaded ${products.length} products from ${absPath}`);
	}
}

export function jsonProductsLoader(options: JsonProductsLoaderOptions): Loader {
	return {
		name: 'json-products-loader',
		load: async (context: LoaderContext) => {
			await runSync(options, context);

			const { watcher, config, logger } = context;
			if (!watcher) {
				return;
			}
			const rootPath = fileURLToPath(config.root);
			const watchedPaths = new Set(options.paths.map((path) => resolve(rootPath, path)));

			const onChange = async (changedPath: string) => {
				if (!watchedPaths.has(changedPath)) {
					return;
				}
				try {
					await runSync(options, context);
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
