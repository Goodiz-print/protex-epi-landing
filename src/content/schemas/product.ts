import { z } from 'astro:content';

export const productSchema = z.object({
	id: z.string(),
	supplier: z.enum(['portwest', 'mascot', 'blaklader']),
	styleCode: z.string(),
	name: z.string(),
	description: z.string(),
	colour: z.string(),
	slug: z.string(),
	price: z.number(),
	currency: z.literal('EUR'),
	imageUrl: z.string().url(),
	sizes: z.array(z.string()),
	category: z.string(),
	subcategory: z.string().nullable(),
	sourceSkus: z.array(z.string()),
});

export type Product = Record<string, unknown> & {
	id: string;
	supplier: 'portwest' | 'mascot' | 'blaklader';
	styleCode: string;
	name: string;
	description: string;
	colour: string;
	slug: string;
	price: number;
	currency: 'EUR';
	imageUrl: string;
	sizes: string[];
	category: string;
	subcategory: string | null;
	sourceSkus: string[];
};
