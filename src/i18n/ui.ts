export const languages = {
	fr: 'Français',
	en: 'English',
};

export const defaultLang = 'fr';

export const ui = {
	fr: {
		'site.title': 'Protex EPI',
		'hero.heading': 'Pour commencer, ouvrez le dossier src/pages dans votre projet.',
		'hero.docs': 'Voir la documentation',
		'hero.discord': 'Rejoindre le Discord',
		'news.title': "Quoi de neuf dans Astro 6.0 ?",
		'news.body':
			"Serveur de dev repensé, polices, live collections, support CSP natif, et bien plus ! Cliquez pour découvrir les nouveautés d'Astro 6.0.",
	},
	en: {
		'site.title': 'Protex EPI',
		'hero.heading': 'To get started, open the src/pages directory in your project.',
		'hero.docs': 'Read our docs',
		'hero.discord': 'Join our Discord',
		'news.title': "What's New in Astro 6.0?",
		'news.body':
			"Redesigned dev server, fonts, live collections, built-in CSP support, and more! Click to explore Astro 6.0's new features.",
	},
} as const;
