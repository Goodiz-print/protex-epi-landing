// Sous-catégories de niveau 3 (listes fournies par le client, sept. 2026 : Corps
// dans le docx, Tête & Mains dans l'Excel protex-epi-sous-categories-tete-mains),
// affichées uniquement en haut des pages de sous-catégorie sous forme de puces
// de filtre — pas dans le menu, pas de routes dédiées. Le matching réutilise
// la mécanique mots-clés de selections.ts, appliquée côté client au nom du
// modèle (champ `t` du payload listing.json).

export interface Refinement {
	slug: string;
	labels: { fr: string; en: string };
	/** Même sémantique que SelectionRule.groups (CNF sur le nom normalisé). */
	groups: string[][];
	exclude?: string[];
}

export const refinements: Record<string, Refinement[]> = {
	'corps/vetements-travail': [
		{
			slug: 'tee-shirts-polos',
			labels: { fr: 'Tee-Shirts & Polos', en: 'T-shirts & Polos' },
			groups: [['t-shirt', 'tee-shirt', 'tee shirt', 'polo']],
		},
		{
			slug: 'sweats-pulls-polaires',
			labels: { fr: 'Sweats, Pulls, Polaires & Gilets', en: 'Sweatshirts, Jumpers, Fleeces & Vests' },
			groups: [['sweat', 'pull', 'polaire', 'hoodie', 'gilet']],
		},
		{
			slug: 'gilets-vestes-sans-manche',
			labels: { fr: 'Gilets & Vestes sans manche', en: 'Vests & Bodywarmers' },
			groups: [['gilet', 'bodywarmer', 'sans manche']],
		},
		{
			slug: 'vestes-softshells-blousons-parkas',
			labels: { fr: 'Vestes, Softshells, Blousons & Parkas', en: 'Jackets, Softshells & Parkas' },
			groups: [['veste', 'softshell', 'blouson', 'parka']],
		},
		{
			slug: 'pantalons-travail',
			labels: { fr: 'Pantalons de travail', en: 'Work trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'bermudas-shorts',
			labels: { fr: 'Bermudas & Shorts de travail', en: 'Work shorts' },
			groups: [['bermuda', 'short']],
		},
		{
			slug: 'combinaisons-cottes-salopettes',
			labels: { fr: 'Combinaisons, Cottes & Salopettes', en: 'Coveralls, Bib & Brace' },
			groups: [['combinaison', 'cotte', 'salopette']],
		},
		{
			slug: 'vetements-multirisques',
			labels: { fr: 'Vêtements multirisques', en: 'Multi-risk clothing' },
			groups: [['multirisque', 'multi-risque', 'bizflame', 'ignifuge', 'retardateur de flamme', 'antistatique', 'arc']],
		},
		{
			slug: 'vetements-rafraichissants-chaleur',
			labels: { fr: 'Vêtements rafraîchissants, Protection Chaleur', en: 'Cooling & Heat protection' },
			groups: [['rafraichissant', 'cooling', 'anti-uv', 'protection solaire', 'chaleur']],
		},
		{
			slug: 'vetements-jetables',
			labels: { fr: 'Vêtements jetables, Usage unique', en: 'Disposable clothing' },
			groups: [['jetable', 'usage unique']],
		},
		{ slug: 'tabliers', labels: { fr: 'Tabliers', en: 'Aprons' }, groups: [['tablier']] },
		{ slug: 'blouses', labels: { fr: 'Blouses', en: 'Coats & Smocks' }, groups: [['blouse']] },
		{
			slug: 'accessoires',
			labels: { fr: 'Accessoires', en: 'Accessories' },
			groups: [['ceinture', 'bretelle', 'genouillere', 'chaussette', 'bonnet', 'echarpe', 'tour de cou', 'accessoire', 'sac', 'kitbag', 'fourre-tout', 'manchette']],
		},
	],
	'corps/vetements-haute-visibilite': [
		{
			slug: 'gilets-haute-visibilite',
			labels: { fr: 'Gilets haute visibilité', en: 'Hi-vis vests' },
			groups: [['gilet', 'baudrier']],
		},
		{
			slug: 't-shirts-polos-haute-visibilite',
			labels: { fr: 'T-shirts et Polos haute visibilité', en: 'Hi-vis t-shirts & polos' },
			groups: [['t-shirt', 'tee-shirt', 'polo']],
		},
		{
			slug: 'sweats-polaires-haute-visibilite',
			labels: { fr: 'Sweats et Polaires haute visibilité', en: 'Hi-vis sweatshirts & fleeces' },
			groups: [['sweat', 'polaire', 'pull']],
		},
		{
			slug: 'bodywarmers-haute-visibilite',
			labels: { fr: 'Bodywarmers haute visibilité', en: 'Hi-vis bodywarmers' },
			groups: [['bodywarmer', 'sans manche']],
		},
		{
			slug: 'vestes-haute-visibilite',
			labels: { fr: 'Vestes haute visibilité', en: 'Hi-vis jackets' },
			groups: [['veste', 'blouson', 'parka', 'softshell']],
		},
		{
			slug: 'pantalons-haute-visibilite',
			labels: { fr: 'Pantalons haute visibilité', en: 'Hi-vis trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'bermudas-haute-visibilite',
			labels: { fr: 'Bermudas haute visibilité', en: 'Hi-vis shorts' },
			groups: [['bermuda', 'short']],
		},
	],
	'corps/vetements-pluie': [
		{
			slug: 'vestes-pluie',
			labels: { fr: 'Vestes de pluie', en: 'Rain jackets' },
			groups: [['veste', 'blouson', 'parka', 'cire']],
		},
		{
			slug: 'pantalons-pluie',
			labels: { fr: 'Pantalons de pluie', en: 'Rain trousers' },
			groups: [['pantalon']],
		},
		{
			slug: 'combinaisons-ensembles-pluie',
			labels: { fr: 'Combinaisons & Ensembles de pluie', en: 'Rain coveralls & suits' },
			groups: [['combinaison', 'ensemble']],
		},
	],
	'corps/equipement-antichute': [
		{ slug: 'harnais', labels: { fr: 'Harnais de sécurité', en: 'Safety harnesses' }, groups: [['harnais']] },
		{
			slug: 'accessoires-antichute',
			labels: { fr: 'Accessoires antichute', en: 'Fall-arrest accessories' },
			groups: [],
			exclude: ['harnais'],
		},
	],
	'tete/protection-tete': [
		{
			slug: 'bonnets',
			labels: { fr: 'Bonnets', en: 'Beanies' },
			groups: [['bonnet', 'beanie']],
			exclude: ['pour bonnet'],
		},
		{
			slug: 'casquettes',
			labels: { fr: 'Casquettes', en: 'Caps' },
			groups: [['casquette', 'trucker cap']],
			exclude: ['anti-heurt', 'anti heurt', 'bump cap'],
		},
		{
			slug: 'accessoires-casques',
			labels: { fr: 'Accessoires pour casques', en: 'Helmet accessories' },
			groups: [['pour casque', 'du casque', 'jugulaire', 'mentonniere', 'lampe cap', 'lampe led', 'lampe frontale', 'serre-tete', 'pour bonnet', 'anti-transpiration']],
		},
		{
			slug: 'casques-chantier',
			labels: { fr: 'Casques de chantier', en: 'Safety helmets' },
			groups: [['casque', 'helmet', 'expertbase']],
			exclude: ['pour casque', 'du casque', 'jugulaire', 'mentonniere', 'soudage', 'anti-bruit', 'antibruit', 'casquette', 'bonnet', 'serre-tete', 'support', 'lampe'],
		},
		{
			slug: 'casques-visiere',
			labels: { fr: 'Casques à visière intégrée', en: 'Helmets with integrated visor' },
			groups: [['casque', 'helmet'], ['visiere', 'visor']],
			exclude: ['pour casque', 'de rechange', 'casquette', 'bonnet', 'serre-tete', 'support'],
		},
		{
			slug: 'cagoules-balaclavas',
			labels: { fr: 'Cagoules & Balaclavas', en: 'Balaclavas' },
			groups: [['cagoule', 'balaclava']],
		},
		{
			slug: 'cache-cou-echarpes',
			labels: { fr: 'Cache-cou, tours de cou & écharpes', en: 'Neck warmers & scarves' },
			groups: [['cache-cou', 'tour de cou', 'echarpe', 'hijab', 'foulard']],
		},
		{
			slug: 'chapkas-chapeaux-berets',
			labels: { fr: 'Chapkas, chapeaux & bérets', en: 'Trapper hats, hats & berets' },
			groups: [['chapka', 'chapeau', 'beret']],
		},
		{
			slug: 'casquettes-anti-heurt',
			labels: { fr: 'Casquettes anti-heurt (bump caps)', en: 'Bump caps' },
			groups: [['anti-heurt', 'anti heurt', 'bump cap']],
		},
		{
			slug: 'bandanas-bandeaux',
			labels: { fr: 'Bandanas & bandeaux', en: 'Bandanas & headbands' },
			groups: [['bandana', 'bandeau']],
			exclude: ['anti-transpiration'],
		},
		{
			slug: 'casques-soudage',
			labels: { fr: 'Casques de soudage', en: 'Welding helmets' },
			groups: [['soudage', 'bizweld']],
		},
		{
			slug: 'charlottes-hygiene',
			labels: { fr: 'Charlottes / hygiène', en: 'Hairnets / hygiene' },
			groups: [['charlotte']],
		},
	],
	'tete/protection-yeux': [
		{
			slug: 'lunettes',
			labels: { fr: 'Lunettes de protection', en: 'Safety glasses' },
			groups: [['lunette', 'glasses', 'goggle']],
		},
		{
			slug: 'visieres-ecrans',
			labels: { fr: 'Visières & écrans faciaux', en: 'Visors & face shields' },
			groups: [['visiere', 'visor', 'ecran', 'eye-shield']],
			exclude: ['lunette'],
		},
		{
			slug: 'masques',
			labels: { fr: 'Masques & lunettes-masques', en: 'Goggles & mask goggles' },
			groups: [['masque']],
		},
		{
			slug: 'accessoires-entretien',
			labels: { fr: 'Accessoires & entretien', en: 'Accessories & cleaning' },
			groups: [['etui', 'cordon', 'lingette', 'nettoyage', 'protege-menton', 'kit forestier']],
		},
	],
	'tete/protection-ouie': [
		{
			slug: 'bouchons-oreille',
			labels: { fr: 'Bouchons d\'oreille', en: 'Earplugs' },
			groups: [['bouchon', 'earplug', 'ear plug']],
		},
		{
			slug: 'casques-antibruit',
			labels: { fr: 'Casques antibruit', en: 'Ear defenders' },
			groups: [['casque', 'ear defender', 'protection auditive']],
			exclude: ['coquille', 'pour casque', 'sur casque'],
		},
		{
			slug: 'coquilles-antibruit',
			labels: { fr: 'Coquilles antibruit', en: 'Helmet-mounted ear defenders' },
			groups: [['coquille']],
		},
		{
			slug: 'distributeurs-accessoires',
			labels: { fr: 'Distributeurs & accessoires', en: 'Dispensers & accessories' },
			groups: [['distributeur', 'dispenser', 'boite de rangement', 'recharge']],
		},
	],
	'tete/protection-respiratoire': [
		{
			slug: 'masques-jetables-ffp',
			labels: { fr: 'Masques jetables FFP1/FFP2/FFP3', en: 'Disposable FFP1/FFP2/FFP3 masks' },
			groups: [['ffp']],
		},
		{
			slug: 'filtres-cartouches',
			labels: { fr: 'Filtres & cartouches', en: 'Filters & cartridges' },
			groups: [['filtre', 'cartouche']],
		},
		{
			slug: 'demi-masques',
			labels: { fr: 'Demi-masques réutilisables', en: 'Reusable half masks' },
			groups: [['demi-masque', 'demi masque', 'half mask']],
			exclude: ['storage', 'sac', 'etui'],
		},
		{
			slug: 'accessoires',
			labels: { fr: 'Accessoires', en: 'Accessories' },
			groups: [['storage bag', 'sac', 'etui', 'film protecteur', 'de rechange']],
		},
		{
			slug: 'cagoules-respiratoires',
			labels: { fr: 'Cagoules respiratoires', en: 'Respiratory hoods' },
			groups: [['cagoule']],
		},
		{
			slug: 'masques-complets',
			labels: { fr: 'Masques complets réutilisables', en: 'Reusable full-face masks' },
			groups: [['masque complet', 'full face']],
		},
	],
	'mains/gants-protection': [
		{
			slug: 'gants-travail-polyvalents',
			labels: { fr: 'Gants de travail polyvalents', en: 'General-purpose work gloves' },
			groups: [['gant', 'glove', 'glv', 'moufle', 'dermiflex', 'nitrile', 'grip']],
			exclude: ['coupure', 'cut', 'chimie', 'chimique', 'chem', 'latex', 'pvc', 'jetable', 'caoutchouc', 'nitrosafe', 'butyl', 'neoprene', 'piqure', 'soudeur', 'soudage', 'soudure', 'chaleur', 'heat', 'impact', 'vibration', 'choc', 'esd', 'antistatique', 'froid', 'cold', 'frigorifique', 'pour gants', 'tendeur', 'cuisine', 'isole', 'sac de presentation'],
		},
		{
			slug: 'gants-anti-coupure',
			labels: { fr: 'Gants anti-coupure', en: 'Cut-resistant gloves' },
			groups: [['coupure', 'cut']],
		},
		{
			slug: 'gants-chimie-latex-jetables',
			labels: { fr: 'Gants chimie, latex & jetables', en: 'Chemical, latex & disposable gloves' },
			groups: [['chimie', 'chimique', 'chem ', 'latex', 'pvc', 'jetable', 'disposable', 'caoutchouc', 'nitrosafe', 'butyl', 'neoprene', 'piqure']],
			exclude: ['sans latex', 'insulatex', 'coupure', 'cut'],
		},
		{
			slug: 'gants-soudeur-chaleur',
			labels: { fr: 'Gants soudeur & chaleur', en: 'Welding & heat gloves' },
			groups: [['soudeur', 'soudage', 'soudure', 'chaleur', 'heat', 'weld']],
		},
		{
			slug: 'gants-impact-vibration',
			labels: { fr: 'Gants anti-choc / anti-vibration', en: 'Impact / anti-vibration gloves' },
			groups: [['impact', 'vibration', 'choc']],
		},
		{
			slug: 'gants-esd-antistatique',
			labels: { fr: 'Gants antistatiques / ESD', en: 'ESD / antistatic gloves' },
			groups: [['esd', 'antistatique']],
			exclude: ['basket', 'sweat', 'chaussure'],
		},
		{
			slug: 'gants-hiver-thermiques',
			labels: { fr: 'Gants hiver / thermiques', en: 'Winter / thermal gloves' },
			groups: [['hiver', 'winter', 'therm', 'insulatex', 'isole', 'chauffant']],
			exclude: ['veste', 'parka', 'pantalon', 'combinaison', 'bodywarmer'],
		},
		{
			slug: 'accessoires-gants',
			labels: { fr: 'Accessoires pour gants', en: 'Glove accessories' },
			groups: [['pour gants', 'pour les gants', 'tendeur de gants']],
		},
		{
			slug: 'gants-grand-froid',
			labels: { fr: 'Gants grand froid', en: 'Cold-storage gloves' },
			groups: [['froid', 'cold', 'frigorifique']],
		},
		{
			slug: 'gants-hygiene-alimentaire',
			labels: { fr: 'Gants hygiène alimentaire', en: 'Food hygiene gloves' },
			groups: [['cuisine', 'alimentaire']],
			exclude: ['pantalon', 'veste'],
		},
		{
			slug: 'gants-distributeurs',
			labels: { fr: 'Gants pour distributeurs automatiques', en: 'Vending-machine gloves' },
			groups: [['distributeur', 'distribution automatique', 'vending']],
		},
	],
};

export function getRefinements(categorySlug: string, subcategorySlug: string | null): Refinement[] {
	if (!subcategorySlug) return [];
	return refinements[`${categorySlug}/${subcategorySlug}`] ?? [];
}
