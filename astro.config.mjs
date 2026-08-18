// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	// TODO: confirm the final production domain before launch — placeholder set to the
	// domain this project is meant to replace.
	site: 'https://www.protex-epi.com',
	i18n: {
		defaultLocale: 'fr',
		locales: ['fr', 'en'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
	integrations: [
		sitemap({
			i18n: {
				defaultLocale: 'fr',
				locales: { fr: 'fr-FR', en: 'en-US' },
			},
			filter: (page) => !page.includes('/produits/a-trier/') && !page.includes('/products/a-trier/'),
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
