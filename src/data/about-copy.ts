import type { Lang } from '~/utils/catalog';

type Copy = Record<Lang, string>;

export const aboutCopy = {
	metaTitle: { fr: 'Qui sommes-nous', en: 'About us' } satisfies Copy,
	metaDescription: {
		fr: 'ProTex EPI conçoit et personnalise les vêtements de travail et les EPI des professionnels et des organismes publics. Une marque du groupe Goodiz Print, depuis Bordeaux.',
		en: 'ProTex EPI designs and customises workwear and PPE for professionals and public organisations. A Goodiz Print group brand, based in Bordeaux.',
	} satisfies Copy,

	heroKicker: { fr: 'Qui sommes-nous', en: 'About us' } satisfies Copy,
	heroTitle: {
		fr: 'Des équipements à l’image de votre collectivité.',
		en: 'Equipment in your local authority’s image.',
	} satisfies Copy,
	heroLead: {
		fr: 'ProTex EPI conçoit et personnalise les vêtements de travail et les EPI des organismes publics. Mairies, départements, régions, universités : un interlocuteur unique, de l’étude à la livraison.',
		en: 'ProTex EPI designs and customises workwear and PPE for public organisations. Town halls, departments, regions, universities: a single point of contact, from study to delivery.',
	} satisfies Copy,
	heroImageAlt: {
		fr: 'Agents équipés en vêtements de travail personnalisés',
		en: 'Staff wearing customised workwear',
	} satisfies Copy,

	publicsTag: { fr: 'Publics', en: 'Who we serve' } satisfies Copy,
	publicsTitle: {
		fr: 'Une offre pensée pour les acheteurs publics.',
		en: 'An offer designed for public buyers.',
	} satisfies Copy,
	publicsLead: {
		fr: 'Services techniques, espaces verts, voirie, bâtiments, campus, restauration collective ou police municipale : vos agents ont besoin de tenues conformes, identifiables et capables de durer.',
		en: 'Technical services, parks, roads, buildings, campuses, collective catering or municipal police: your teams need compliant, identifiable garments built to last.',
	} satisfies Copy,
	publicsLink: {
		fr: 'Découvrez notre sélection Collectivités',
		en: 'Discover our Local authorities selection',
	} satisfies Copy,

	groupTag: { fr: 'Le groupe', en: 'The group' } satisfies Copy,
	groupTitle: {
		fr: 'ProTex EPI appartient au groupe Goodiz Print.',
		en: 'ProTex EPI is part of the Goodiz Print group.',
	} satisfies Copy,
	groupBody1: {
		fr: 'Depuis Bordeaux, le groupe Goodiz Print accompagne les organisations publiques et privées dans leurs projets de textile personnalisé et d’objets professionnels. ProTex EPI est la marque dédiée aux équipements de protection individuelle et aux vêtements de travail.',
		en: 'From Bordeaux, the Goodiz Print group supports public and private organisations with their customised textile and professional merchandise projects. ProTex EPI is the brand dedicated to personal protective equipment and workwear.',
	} satisfies Copy,
	groupBody2: {
		fr: 'Vous retrouvez la même exigence de suivi, appliquée aux contraintes du terrain et de la commande publique.',
		en: 'You get the same standard of service, applied to the constraints of the field and of public procurement.',
	} satisfies Copy,
	groupImageAlt: { fr: 'Vêtements corporate personnalisés', en: 'Customised corporate clothing' } satisfies Copy,

	catalogTag: { fr: 'Catalogue', en: 'Catalogue' } satisfies Copy,
	catalogTitle: {
		fr: 'Des tenues visibles, utiles au quotidien.',
		en: 'Visible garments, useful every day.',
	} satisfies Copy,

	customisationTag: { fr: 'Personnalisation', en: 'Customisation' } satisfies Copy,
	customisationTitle: {
		fr: 'Votre identité, marquée durablement.',
		en: 'Your identity, durably marked.',
	} satisfies Copy,
	customisationLead: {
		fr: 'Broderie, sérigraphie ou transfert : la technique est choisie selon le textile, le volume et les conditions d’usage. Une visualisation précède chaque validation.',
		en: 'Embroidery, screen printing or transfer: the technique is chosen according to the fabric, the volume and the conditions of use. A visual proof precedes every approval.',
	} satisfies Copy,
	customisationLink: {
		fr: 'En savoir plus sur la personnalisation',
		en: 'More about customisation',
	} satisfies Copy,

	methodTag: { fr: 'Méthode', en: 'How it works' } satisfies Copy,
	methodTitle: {
		fr: 'Un déroulé simple pour vos services achats.',
		en: 'A simple process for your procurement teams.',
	} satisfies Copy,
	methodBody1: {
		fr: 'Devis lisible, maquette de marquage, conseil sur les tailles et les coloris, puis suivi de production. L’objectif est d’habiller vos agents sans alourdir vos procédures.',
		en: 'Clear quote, marking mock-up, advice on sizes and colours, then production follow-up. The goal is to equip your staff without weighing down your procedures.',
	} satisfies Copy,
	methodBody2: {
		fr: 'Une même identité peut ensuite se décliner sur tous les lots : voirie, bâtiments, ateliers ou campus.',
		en: 'The same identity can then be rolled out across every lot: roads, buildings, workshops or campuses.',
	} satisfies Copy,
	methodImageAlt: { fr: 'Équipe d’agents sur le terrain', en: 'Team of staff in the field' } satisfies Copy,

	commitmentsTag: { fr: 'Engagements', en: 'Commitments' } satisfies Copy,
	commitmentsTitle: {
		fr: 'Les engagements du groupe, appliqués aux EPI.',
		en: 'The group’s commitments, applied to PPE.',
	} satisfies Copy,
	cityLabel: { fr: 'Depuis Bordeaux.', en: 'From Bordeaux.' } satisfies Copy,
	cityImageAlt: { fr: 'Place de la Bourse, Bordeaux', en: 'Place de la Bourse, Bordeaux' } satisfies Copy,

	ctaTitle: {
		fr: 'Un renouvellement de stock ou un premier lot à lancer ?',
		en: 'Restocking or launching a first lot?',
	} satisfies Copy,
	ctaBody: {
		fr: 'Parlons de vos agents, de vos délais et de votre charte graphique.',
		en: 'Let’s talk about your staff, your deadlines and your brand guidelines.',
	} satisfies Copy,
	phoneLabel: { fr: '05 57 02 75 87', en: '+33 5 57 02 75 87' } satisfies Copy,
	phoneHref: { fr: 'tel:0557027587', en: 'tel:+33557027587' } satisfies Copy,
	ctaButton: { fr: 'Demander un devis', en: 'Request a quote' } satisfies Copy,
};

export const aboutPills: Record<Lang, string[]> = {
	fr: ['Mairies', 'Départements', 'Régions', 'Universités', 'Établissements publics'],
	en: ['Town halls', 'Departments', 'Regions', 'Universities', 'Public institutions'],
};

export interface AboutItem {
	title: string;
	body: string;
}

export interface AboutImageItem extends AboutItem {
	alt: string;
}

export const aboutPublics: Record<Lang, AboutItem[]> = {
	fr: [
		{ title: 'Mairies', body: 'Ateliers municipaux, espaces verts, interventions et accueil du public.' },
		{ title: 'Départements et régions', body: 'Parcs, collèges, lycées, routes et sites patrimoniaux.' },
		{ title: 'Universités', body: 'Personnel technique, laboratoires, accueil et sécurité des campus.' },
		{
			title: 'Établissements publics',
			body: 'Lots textile et EPI cohérents avec votre identité institutionnelle.',
		},
	],
	en: [
		{ title: 'Town halls', body: 'Municipal workshops, parks and gardens, field work and front-desk teams.' },
		{ title: 'Departments and regions', body: 'Parks, secondary schools, roads and heritage sites.' },
		{ title: 'Universities', body: 'Technical staff, laboratories, reception and campus security.' },
		{ title: 'Public institutions', body: 'Textile and PPE lots consistent with your institutional identity.' },
	],
};

/** Ordre aligné sur les images de AboutPage.astro : veste HV, couvre-chefs, polo brodé. */
export const aboutCatalog: Record<Lang, AboutImageItem[]> = {
	fr: [
		{
			title: 'Haute visibilité',
			body: 'Vestes, parkas et ensembles pour les interventions extérieures.',
			alt: 'Veste haute visibilité',
		},
		{
			title: 'Casques et accessoires',
			body: 'Casques, bonnets et casquettes aux couleurs de la collectivité.',
			alt: 'Casque, bonnet et casquette',
		},
		{
			title: 'Textile de service',
			body: 'Polos, vestes et softshells pour l’accueil et les équipes internes.',
			alt: 'Polo brodé',
		},
	],
	en: [
		{
			title: 'High visibility',
			body: 'Jackets, parkas and sets for outdoor operations.',
			alt: 'High-visibility jacket',
		},
		{
			title: 'Helmets and accessories',
			body: 'Helmets, beanies and caps in your authority’s colours.',
			alt: 'Helmet, beanie and cap',
		},
		{
			title: 'Service textiles',
			body: 'Polos, jackets and softshells for front-desk and in-house teams.',
			alt: 'Embroidered polo shirt',
		},
	],
};

/** Ordre aligné sur les images de AboutPage.astro : broderie, sérigraphie, transfert, emplacements. */
export const aboutTechniques: Record<Lang, AboutImageItem[]> = {
	fr: [
		{ title: 'Broderie', body: 'Polos, bonnets et vestes portés longtemps.', alt: 'Broderie' },
		{ title: 'Sérigraphie', body: 'Grands formats et séries homogènes.', alt: 'Sérigraphie' },
		{ title: 'Transfert', body: 'Détails nets, petites et moyennes séries.', alt: 'Transfert' },
		{ title: 'Emplacements', body: 'Poitrine, dos, manche ou patch rapporté.', alt: 'Emplacements de marquage' },
	],
	en: [
		{ title: 'Embroidery', body: 'Polos, beanies and jackets worn for years.', alt: 'Embroidery' },
		{ title: 'Screen printing', body: 'Large formats and consistent runs.', alt: 'Screen printing' },
		{ title: 'Transfer', body: 'Sharp details, small and medium runs.', alt: 'Transfer' },
		{ title: 'Placements', body: 'Chest, back, sleeve or sewn-on patch.', alt: 'Marking placements' },
	],
};

export const aboutCommitments: Record<Lang, string[]> = {
	fr: [
		'Préservation des océans, aux côtés de SEAQUAL® INITIATIVE.',
		'Soutien aux ruches et à la biodiversité en France.',
		'Priorité au textile fabriqué en France et en Europe, lorsque la référence le permet.',
		'Reforestation : une commande, un arbre planté.',
	],
	en: [
		'Ocean preservation, alongside the SEAQUAL® INITIATIVE.',
		'Support for beehives and biodiversity in France.',
		'Priority to textiles made in France and Europe whenever the reference allows.',
		'Reforestation: one order, one tree planted.',
	],
};
