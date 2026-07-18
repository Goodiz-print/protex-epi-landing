import { defineCollection } from 'astro:content';
import { jsonProductsLoader } from './content/loaders/json-products-loader';
import { productSchema } from './content/schemas/product';

const products = defineCollection({
	loader: jsonProductsLoader({
		paths: ['src/data/catalog/products.portwest.json', 'src/data/catalog/products.blaklader.json'],
	}),
	schema: productSchema,
});

export const collections = { products };
