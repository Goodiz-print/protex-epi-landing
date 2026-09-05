import type { Lang } from '~/utils/catalog';

type Copy = Record<Lang, string>;

export const customisationCopy = {
	metaTitle: {
		fr: 'Personnalisation de vos EPI et vêtements professionnels',
		en: 'Customising your PPE and workwear',
	} satisfies Copy,
	metaDescription: {
		fr: 'Marquage de vos EPI et vêtements de travail : broderie, transfert ou sérigraphie, dans le respect des normes de sécurité. Devis sous 24h.',
		en: 'Marking on PPE and workwear: embroidery, transfer or screen printing, in full compliance with safety standards. Quote within 24h.',
	} satisfies Copy,
	h1: { fr: 'Personnalisation', en: 'Customisation' } satisfies Copy,
	lead: {
		fr: 'Des EPI et vêtements de travail à votre image',
		en: 'PPE and workwear in your company colours',
	} satisfies Copy,
	intro: {
		fr: "Faire porter vos couleurs, c'est rendre vos équipes identifiables dès le premier regard — sur un chantier, dans un atelier ou au contact du public. Nous marquons vos équipements pour un rendu durable, pensé pour les usages intensifs et compatible avec les normes de sécurité.",
		en: 'Putting your colours on the team makes them recognisable at a glance — on site, in the workshop or in front of the public. We mark your equipment for a durable finish, designed for intensive use and compatible with safety standards.',
	} satisfies Copy,
	highlights: {
		fr: [
			'Marquage résistant aux lavages et aux conditions de chantier',
			'Broderie, transfert ou sérigraphie selon le support et la série',
			'Un accompagnement de A à Z, du fichier logo à la livraison',
		],
		en: [
			'Marking that stands up to washing and site conditions',
			'Embroidery, transfer or screen printing depending on fabric and volume',
			'End-to-end support, from the logo file through to delivery',
		],
	},
	compliance: {
		fr: "Chaque marquage respecte le Règlement (UE) 2016/425 : sur les vêtements haute visibilité, les bandes réfléchissantes obligatoires restent intactes.",
		en: 'Every marking complies with Regulation (EU) 2016/425: on high-visibility garments, the mandatory reflective bands are left intact.',
	} satisfies Copy,
	equipmentTitle: {
		fr: 'Quels équipements personnaliser ?',
		en: 'What can be customised?',
	} satisfies Copy,
	equipmentIntro: {
		fr: "Entreprises, collectivités ou artisans : nous marquons un large choix d'équipements pour afficher votre identité et identifier vos équipes sur le terrain.",
		en: 'Companies, local authorities or trades: we mark a wide range of equipment to display your identity and identify your teams on the ground.',
	} satisfies Copy,
	techniquesTitle: { fr: 'Nos techniques de marquage', en: 'Our marking techniques' } satisfies Copy,
	techniquesIntro: {
		fr: "Broderie, transfert ou sérigraphie : le procédé se choisit selon le textile, le volume et les contraintes d'usage, pour un rendu net, durable et conforme à votre activité.",
		en: 'Embroidery, transfer or screen printing: the process is chosen according to the fabric, the volume and the conditions of use, for a clean, durable finish that fits your activity.',
	} satisfies Copy,
	techniquesOutro: {
		fr: 'Pour le détail de chaque procédé, consultez notre',
		en: 'For the details of each process, see our',
	} satisfies Copy,
	guideLink: { fr: 'guide de marquage', en: 'marking guide' } satisfies Copy,
	stepsTitle: { fr: 'Comment ça se passe ?', en: 'How does it work?' } satisfies Copy,
	whyTitle: {
		fr: 'Pourquoi personnaliser vos équipements ?',
		en: 'Why customise your equipment?',
	} satisfies Copy,
	ctaTitle: { fr: 'Un projet de personnalisation ?', en: 'Planning a customisation project?' } satisfies Copy,
	ctaBody: {
		fr: 'Échangeons sur vos volumes, vos supports et votre logo. Réponse sous 24h — sans engagement.',
		en: 'Tell us about volumes, fabrics and your logo. Reply within 24h — no obligation.',
	} satisfies Copy,
	ctaButton: { fr: 'Demander mon devis', en: 'Request my quote' } satisfies Copy,
};

export const customisationEquipment = {
	fr: [
		{
			title: 'Vêtements de travail',
			body: 'T-shirts, polos, sweats, vestes, pantalons, softshells et doudounes de nos gammes : le logo se pose là où vos équipes le portent au quotidien.',
		},
		{
			title: 'Vêtements haute visibilité',
			body: 'Gilets, vestes et sweats HV marqués sans empiéter sur les surfaces fluorescentes ni les bandes réfléchissantes, pour conserver la classe de visibilité.',
		},
		{
			title: 'Casques, casquettes et bonnets',
			body: 'Certains équipements de protection de la tête se marquent aussi — selon la compatibilité de chaque modèle — pour une identification claire de vos intervenants.',
		},
	],
	en: [
		{
			title: 'Workwear',
			body: 'T-shirts, polos, sweatshirts, jackets, trousers, softshells and padded jackets from our ranges: the logo goes where your teams wear it every day.',
		},
		{
			title: 'High-visibility clothing',
			body: 'Hi-vis vests, jackets and sweatshirts marked without covering fluorescent surfaces or reflective bands, so the visibility class is preserved.',
		},
		{
			title: 'Helmets, caps and beanies',
			body: 'Some head-protection items can be marked too — depending on each model — for a clear identification of your people on site.',
		},
	],
};

export const customisationTechniques = {
	fr: [
		{
			name: 'Broderie',
			body: "Le logo est brodé au fil dans le textile. C'est le rendu le plus durable et le plus valorisant, idéal pour polos, sweats, vestes, bonnets et casquettes portés tous les jours.",
		},
		{
			name: 'Transfert',
			body: 'Un marquage net, adapté aux petites et moyennes séries comme aux logos détaillés ou multicolores. Particulièrement indiqué sur la haute visibilité, car il préserve les zones réfléchissantes.',
		},
		{
			name: 'Sérigraphie',
			body: 'La référence pour les grandes séries et les grands formats : couleurs franches, bon rapport qualité-prix et rendu homogène sur toute la dotation — t-shirts, gilets, dos de vestes.',
		},
	],
	en: [
		{
			name: 'Embroidery',
			body: 'The logo is stitched into the fabric. It is the most durable, premium finish, ideal for polos, sweatshirts, jackets, beanies and caps worn every day.',
		},
		{
			name: 'Transfer',
			body: 'A sharp marking suited to small and medium runs as well as detailed or multicolour logos. Especially appropriate on high-visibility garments, as it preserves the reflective zones.',
		},
		{
			name: 'Screen printing',
			body: 'The reference for large runs and large formats: solid colours, strong value and a consistent finish across the whole fleet — t-shirts, vests, jacket backs.',
		},
	],
};

export const customisationSteps = {
	fr: [
		{ title: 'Choix des équipements', body: 'Vous sélectionnez les EPI et vêtements à marquer selon votre activité.' },
		{ title: 'Transmission du logo', body: 'Vous nous envoyez votre logo ou votre charte, nous préparons le fichier.' },
		{
			title: 'Conseils techniques',
			body: 'Nous recommandons le procédé et les emplacements adaptés au support, au volume et aux conditions d’usage.',
		},
		{ title: 'Validation', body: 'Vous validez une maquette précise avant tout lancement en production.' },
		{ title: 'Production et livraison', body: 'Nous produisons puis livrons vos équipements dans les délais convenus.' },
	],
	en: [
		{ title: 'Choose your equipment', body: 'You pick the PPE and garments to mark according to your activity.' },
		{ title: 'Send us your logo', body: 'Share your logo or brand guidelines — we prepare the artwork.' },
		{
			title: 'Technical advice',
			body: 'We recommend the process and placements that fit the fabric, the volume and the conditions of use.',
		},
		{ title: 'Approval', body: 'You approve a precise mock-up before anything goes to production.' },
		{ title: 'Production and delivery', body: 'We produce and deliver your equipment to the agreed schedule.' },
	],
};

export const customisationBenefits = {
	fr: [
		'Une présentation homogène de vos équipes, de l’atelier au chantier',
		'Une identification immédiate des intervenants par vos clients et partenaires',
		'Un signal de sérieux et de professionnalisme à chaque intervention',
		'Une visibilité quotidienne de votre marque, là où vos équipes travaillent',
	],
	en: [
		'A consistent look for your teams, from the workshop to the site',
		'Immediate identification of your people by customers and partners',
		'A clear signal of professionalism at every job',
		'Daily brand visibility wherever your teams work',
	],
};
