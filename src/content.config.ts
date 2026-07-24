import { defineCollection } from 'astro:content';
import { csvProductsLoader } from './content/loaders/csv-products-loader';
import { productSchema } from './content/schemas/product';

const products = defineCollection({
	loader: csvProductsLoader({
		sources: [
			{
				supplier: 'portwest',
				csvPath: 'src/data/suppliers/portwest/product_sheet_FR_A8_20.csv',
				mappingPath: 'src/data/category-mapping.portwest.json',
			},
			{
				supplier: 'mascot',
				csvPath: 'src/data/suppliers/mascot/mascot-products.slim.csv',
				mappingPath: 'src/data/category-mapping.mascot.json',
			},
			{
				supplier: 'blaklader',
				commercePath: 'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B01_COMMERCE.csv',
				variantePath: 'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - C03_VARIANTE.csv',
				mediaPath: 'src/data/suppliers/blaklader/Blaklader - FAB-DIS 3.0 - 2026.xlsm - B03_MEDIA.csv',
				mappingPath: 'src/data/category-mapping.blaklader.json',
			},
		],
	}),
	schema: productSchema,
});

export const collections = { products };
