import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import type { Loader, LoaderContext } from 'astro/loaders';
import {
	buildBlakladerColourIndex,
	buildBlakladerMediaIndex,
	buildBlakladerProductEntry,
	buildProductEntry,
	groupBlakladerRows,
	groupPortwestRows,
	type CategoryMapping,
	type PortwestCsvRow,
} from './csv-products-loader.helpers';

export interface PortwestCsvSource {
	supplier: 'portwest' | 'mascot';
	csvPath: string;
	mappingPath: string;
}

export interface BlakladerCsvSource {
	supplier: 'blaklader';
	commercePath: string;
	variantePath: string;
	mediaPath: string;
	mappingPath: string;
}

export type CsvProductSource = PortwestCsvSource | BlakladerCsvSource;

export interface CsvProductsLoaderOptions {
	sources: CsvProductSource[];
}

function readCsv(absPath: string): PortwestCsvRow[] {
	const content = readFileSync(absPath, 'utf-8');
	return parse(content, {
		columns: true,
		bom: true,
		trim: true,
		skip_empty_lines: true,
	});
}

async function runSync(options: CsvProductsLoaderOptions, context: LoaderContext, watchedPaths: Set<string>) {
	const { store, config, logger, parseData, generateDigest } = context;
	const rootPath = fileURLToPath(config.root);

	store.clear();

	for (const source of options.sources) {
		const mappingAbsPath = resolve(rootPath, source.mappingPath);
		watchedPaths.add(mappingAbsPath);
		const mapping: CategoryMapping = JSON.parse(readFileSync(mappingAbsPath, 'utf-8'));

		if (source.supplier === 'blaklader') {
			const commerceAbsPath = resolve(rootPath, source.commercePath);
			const varianteAbsPath = resolve(rootPath, source.variantePath);
			const mediaAbsPath = resolve(rootPath, source.mediaPath);
			watchedPaths.add(commerceAbsPath);
			watchedPaths.add(varianteAbsPath);
			watchedPaths.add(mediaAbsPath);

			const commerceRows = readCsv(commerceAbsPath);
			const colourIndex = buildBlakladerColourIndex(readCsv(varianteAbsPath));
			const mediaIndex = buildBlakladerMediaIndex(readCsv(mediaAbsPath));

			const groups = groupBlakladerRows(commerceRows);
			let stored = 0;

			for (const group of groups) {
				const { id, data, warnings } = buildBlakladerProductEntry(group, colourIndex, mediaIndex, mapping);
				for (const warning of warnings) {
					logger.warn(`[blaklader] ${warning}`);
				}
				if (!data) {
					continue;
				}
				const parsedData = await parseData({ id, data });
				store.set({ id, data: parsedData, digest: generateDigest(parsedData) });
				stored += 1;
			}

			logger.info(
				`[blaklader] loaded ${stored} products from ${groups.length} groups / ${commerceRows.length} CSV rows (${commerceAbsPath})`,
			);
			continue;
		}

		const csvAbsPath = resolve(rootPath, source.csvPath);
		watchedPaths.add(csvAbsPath);
		const rows = readCsv(csvAbsPath);
		const groups = groupPortwestRows(rows);

		for (const group of groups) {
			const { id, data, warnings } = buildProductEntry(source.supplier, group, mapping);
			for (const warning of warnings) {
				logger.warn(`[${source.supplier}] ${warning}`);
			}
			const parsedData = await parseData({ id, data });
			store.set({ id, data: parsedData, digest: generateDigest(parsedData) });
		}

		logger.info(
			`[${source.supplier}] loaded ${groups.length} products from ${rows.length} CSV rows (${csvAbsPath})`,
		);
	}
}

export function csvProductsLoader(options: CsvProductsLoaderOptions): Loader {
	const watchedPaths = new Set<string>();

	return {
		name: 'csv-products-loader',
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
