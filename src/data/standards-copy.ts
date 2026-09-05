import type { Lang } from '~/utils/catalog';

type Copy = Record<Lang, string>;

export const standardsCopy = {
	metaTitle: {
		fr: 'Les normes des vêtements professionnels',
		en: 'Professional clothing standards',
	} satisfies Copy,
	metaDescription: {
		fr: "Comprendre les normes EPI et vêtements de travail : Règlement (UE) 2016/425, catégories de risque et principales normes EN (EN ISO 20471, EN 343, EN ISO 11612…).",
		en: 'Understand PPE and workwear standards: Regulation (EU) 2016/425, risk categories and the main EN standards (EN ISO 20471, EN 343, EN ISO 11612…).',
	} satisfies Copy,
	h1: {
		fr: 'Les normes des vêtements professionnels',
		en: 'Professional clothing standards',
	} satisfies Copy,
	intro1: {
		fr: "Au travail, l'ensemble du corps peut et doit être protégé. Selon l'activité, la réglementation impose des équipements adaptés : casque et visière, chaussures de sécurité, vêtements contre la pluie, la chaleur, les projections chimiques ou le feu, haute visibilité, protections auditives et respiratoires, harnais antichute.",
		en: 'At work, the whole body can and must be protected. Depending on the activity, regulations require suitable equipment: helmet and visor, safety footwear, clothing against rain, heat, chemical splashes or fire, high visibility, hearing and respiratory protection, fall-arrest harnesses.',
	} satisfies Copy,
	intro2: {
		fr: "Un équipement de protection individuelle (EPI) est un dispositif destiné à être porté ou tenu pour protéger une personne contre un ou plusieurs risques pour sa santé ou sa sécurité. Il n'est efficace que s'il est réellement porté : le confort et l'acceptation par les équipes pèsent autant que le niveau de protection.",
		en: 'Personal protective equipment (PPE) is a device intended to be worn or held to protect a person against one or more risks to their health or safety. It only works if it is actually worn: comfort and acceptance by the teams matter as much as the level of protection.',
	} satisfies Copy,
	regulationTitle: {
		fr: 'Le cadre réglementaire européen',
		en: 'The European regulatory framework',
	} satisfies Copy,
	regulationBody: {
		fr: "Le Règlement (UE) 2016/425 fixe les exigences de conception et de fabrication des EPI mis sur le marché européen. Il vise un haut niveau de protection pour les utilisateurs et la libre circulation de ces équipements dans l'Union. Tous les produits distribués par Protex EPI y sont conformes. Pour les fabricants de vêtements de protection, ces exigences se déclinent concrètement dans les normes EN.",
		en: 'Regulation (EU) 2016/425 sets the design and manufacturing requirements for PPE placed on the European market. It aims for a high level of protection for users and the free movement of this equipment in the Union. All products distributed by Protex EPI comply with it. For manufacturers of protective clothing, these requirements are spelled out in the EN standards.',
	} satisfies Copy,
	categoriesTitle: { fr: "Les trois catégories d'EPI", en: 'The three PPE categories' } satisfies Copy,
	normsTitle: {
		fr: 'Les principales normes EN des vêtements professionnels',
		en: 'The main EN standards for professional clothing',
	} satisfies Copy,
	normsIntro: {
		fr: 'Cliquez sur une norme pour en savoir plus. Chaque fiche produit de notre catalogue indique les certifications applicables.',
		en: 'Click a standard to find out more. Every product page in our catalog lists the applicable certifications.',
	} satisfies Copy,
	catalogLink: { fr: 'Voir les produits concernés', en: 'See matching products' } satisfies Copy,
	helpTitle: { fr: "Besoin d'aide pour choisir ?", en: 'Need help choosing?' } satisfies Copy,
	helpBody: {
		fr: "En cas de doute sur l'adéquation d'un équipement à votre analyse de risques ou à votre document unique, notre équipe vous oriente vers le bon produit et vous fournit fiches techniques et déclarations UE de conformité sur simple demande.",
		en: 'If you are unsure whether an item matches your risk assessment, our team will point you to the right product and provide data sheets and EU declarations of conformity on request.',
	} satisfies Copy,
	ctaButton: { fr: 'Demander un devis', en: 'Request a quote' } satisfies Copy,
};

export const standardsCategories = {
	fr: [
		{
			name: 'Catégorie I — risques mineurs',
			body: "Équipements de conception simple, destinés à des risques dont les effets sont superficiels ou facilement réversibles (frottements, petites projections, intempéries légères). Le marquage CE est obligatoire.",
		},
		{
			name: 'Catégorie II — risques importants',
			body: "Équipements protégeant contre des risques pouvant entraîner des lésions graves. Ils font l'objet d'un examen UE de type par un organisme notifié ; le marquage CE et l'année de fabrication sont requis.",
		},
		{
			name: 'Catégorie III — risques mortels ou irréversibles',
			body: "Équipements protégeant contre les dangers les plus graves (chutes de hauteur, risques chimiques, thermiques, électriques…). La production est contrôlée en continu par un organisme notifié.",
		},
	],
	en: [
		{
			name: 'Category I — minor risks',
			body: 'Simple-design equipment for risks whose effects are superficial or easily reversible (friction, light splashes, mild weather). CE marking is mandatory.',
		},
		{
			name: 'Category II — serious risks',
			body: 'Equipment protecting against risks that can cause serious injury. It undergoes an EU type examination by a notified body; CE marking and the year of manufacture are required.',
		},
		{
			name: 'Category III — fatal or irreversible risks',
			body: 'Equipment protecting against the most serious hazards (falls from height, chemical, thermal or electrical risks…). Production is continuously monitored by a notified body.',
		},
	],
};

export interface StandardEntry {
	code: string;
	label: Copy;
	detail: Copy;
	/** Optional catalog deep-link: [category, subcategory]. */
	catalog?: [string, string];
}

export const workwearStandards: StandardEntry[] = [
	{
		code: 'EN 343',
		label: { fr: 'Protection contre la pluie et les intempéries', en: 'Protection against rain and bad weather' },
		detail: {
			fr: "Elle classe l'imperméabilité et la respirabilité du vêtement. Un indice élevé limite la pénétration de l'eau tout en évacuant la transpiration — indispensable pour le travail en extérieur.",
			en: 'It rates the garment’s waterproofness and breathability. A high rating keeps water out while letting sweat escape — essential for outdoor work.',
		},
		catalog: ['corps', 'vetements-pluie'],
	},
	{
		code: 'EN 1149-5',
		label: { fr: 'Propriétés électrostatiques (antistatique)', en: 'Electrostatic properties (antistatic)' },
		detail: {
			fr: "Le vêtement dissipe les charges électrostatiques pour réduire le risque d'étincelle dans les atmosphères inflammables. Il se porte en tenue complète, sur une chaussure conductrice adaptée.",
			en: 'The garment dissipates electrostatic charges to reduce spark risk in flammable atmospheres. It must be worn as a full outfit, with suitable conductive footwear.',
		},
	},
	{
		code: 'EN ISO 11611',
		label: {
			fr: 'Vêtements de protection pour le soudage et techniques connexes',
			en: 'Protective clothing for welding and allied processes',
		},
		detail: {
			fr: "Elle protège contre les petites projections de métal en fusion, le rayonnement du poste et un contact de courte durée avec la flamme. Deux classes selon l'intensité des projections.",
			en: 'It protects against small molten-metal splashes, welding radiation and brief contact with flame. Two classes according to splash intensity.',
		},
	},
	{
		code: 'EN ISO 11612',
		label: { fr: 'Protection contre la chaleur et les flammes', en: 'Protection against heat and flame' },
		detail: {
			fr: "Elle couvre la propagation de flamme, la chaleur convective, radiante ou de contact, et les projections de métal. Les lettres A, B, C, D, E, F précisent le type d'agression.",
			en: 'It covers flame spread, convective, radiant or contact heat, and molten-metal splashes. Letters A, B, C, D, E, F specify the type of hazard.',
		},
	},
	{
		code: 'EN 13034',
		label: {
			fr: 'Protection contre les pulvérisations de produits chimiques liquides (type 6)',
			en: 'Protection against liquid chemical splashes (type 6)',
		},
		detail: {
			fr: 'Protection limitée contre les légères pulvérisations de produits chimiques liquides. Elle ne remplace pas une combinaison étanche lorsque le risque d’immersion ou de projection forte est identifié.',
			en: 'Limited protection against light sprays of liquid chemicals. It does not replace a sealed suit when immersion or heavy splash risk is identified.',
		},
	},
	{
		code: 'EN 13758-2',
		label: { fr: 'Protection contre le rayonnement UV solaire', en: 'Protection against solar UV radiation' },
		detail: {
			fr: "Le tissu filtre une part du rayonnement ultraviolet. Utile pour les métiers exposés au soleil, en complément des autres protections (casquette, lunettes, crème).",
			en: 'The fabric filters part of ultraviolet radiation. Useful for sun-exposed jobs, on top of other protection (cap, glasses, sunscreen).',
		},
	},
	{
		code: 'EN 14058',
		label: { fr: 'Protection contre les environnements frais', en: 'Protection against cool environments' },
		detail: {
			fr: "Elle s'applique aux températures au-dessus de −5 °C : isolation thermique, résistance au vent et, le cas échéant, à la pluie. Distincte des normes grand froid.",
			en: 'It applies above −5 °C: thermal insulation, wind resistance and, where relevant, rain. Distinct from extreme-cold standards.',
		},
	},
	{
		code: 'EN 14404',
		label: { fr: 'Protection des genoux pour le travail agenouillé', en: 'Knee protection for kneeling work' },
		detail: {
			fr: "Elle définit les genouillères (insérées dans le pantalon ou portées par-dessus) selon le type de sol et la durée d'agenouillement. Un pantalon compatible n'est certifié qu'avec les genouillères prévues.",
			en: 'It defines knee pads (inserted in the trousers or worn over them) according to the floor and how long you kneel. Compatible trousers are only certified with the intended pads.',
		},
	},
	{
		code: 'ISO 15797',
		label: { fr: 'Aptitude au lavage industriel', en: 'Suitability for industrial laundering' },
		detail: {
			fr: "Elle vérifie que le vêtement et son marquage tiennent les cycles de blanchisserie industrielle (température, chimie, séchage). Utile pour les parcs gérés en location ou en pressing centralisé.",
			en: 'It checks that the garment and its marking withstand industrial laundry cycles (temperature, chemistry, drying). Useful for fleets managed through rental or central laundering.',
		},
	},
	{
		code: 'EN 17353',
		label: {
			fr: 'Visibilité améliorée pour situations à risque modéré',
			en: 'Enhanced visibility for medium-risk situations',
		},
		detail: {
			fr: "Une visibilité renforcée hors des exigences de la haute visibilité « route ». Elle concerne des situations à risque plus modéré, sans remplacer un vêtement EN ISO 20471 lorsque celui-ci est obligatoire.",
			en: 'Enhanced visibility outside the requirements of road high-visibility clothing. It covers more moderate-risk situations and does not replace an EN ISO 20471 garment when that is mandatory.',
		},
	},
	{
		code: 'EN ISO 20471',
		label: { fr: 'Vêtements à haute visibilité — classes 1 à 3', en: 'High-visibility clothing — classes 1 to 3' },
		detail: {
			fr: "Elle impose des surfaces minimales de tissu fluorescent et de bandes rétroréfléchissantes, de jour comme de nuit. La classe 3 offre la plus grande visibilité. Le marquage ne doit pas réduire ces surfaces.",
			en: 'It requires minimum areas of fluorescent fabric and retro-reflective bands, by day and by night. Class 3 offers the highest visibility. Marking must not reduce these areas.',
		},
		catalog: ['corps', 'vetements-haute-visibilite'],
	},
	{
		code: 'IEC 61482-2',
		label: {
			fr: "Protection contre les dangers thermiques d'un arc électrique",
			en: 'Protection against the thermal hazards of an electric arc',
		},
		detail: {
			fr: "Elle caractérise la résistance du vêtement à l'arc électrique (APC 1 ou 2, ou valeur ELIM/ATPV). Elle se combine souvent avec les normes chaleur/flamme et antistatique.",
			en: 'It rates the garment’s resistance to an electric arc (APC 1 or 2, or an ELIM/ATPV value). It is often combined with heat/flame and antistatic standards.',
		},
	},
];
