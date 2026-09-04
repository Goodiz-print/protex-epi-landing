/**
 * Sélection « Collectivités » : une courte liste de modèles susceptibles de
 * plaire aux collectivités (mairies, services techniques, établissements
 * publics…) — essentiels haute visibilité, tenues de service, pluie et
 * accessoires. Chaque entrée référence un modèle (supplier + styleCode) ;
 * tous ses coloris sont repris automatiquement.
 *
 * L'ordre de la liste est l'ordre d'affichage sur la page.
 */

export interface CollectivitesStyle {
	supplier: 'portwest' | 'mascot' | 'blaklader';
	styleCode: string;
}

export const collectivitesSelection: CollectivitesStyle[] = [
	// Haute visibilité — l'essentiel de la voirie et des services techniques
	{ supplier: 'portwest', styleCode: 'C474' }, // Gilet double bande
	{ supplier: 'portwest', styleCode: 'C371' }, // Gilet HV zippé bandes ceinture et bretelles
	{ supplier: 'mascot', styleCode: '50216-310' }, // Gilet de circulation
	{ supplier: 'portwest', styleCode: 'RT23' }, // T-shirt Hi-Vis
	{ supplier: 'portwest', styleCode: 'S477' }, // Polo Hi-Vis manches courtes
	{ supplier: 'portwest', styleCode: 'S475' }, // Veste Executive Hi-Vis
	{ supplier: 'portwest', styleCode: 'RT40' }, // Blouson HV bicolore
	{ supplier: 'portwest', styleCode: 'S460' }, // Parka d'hiver Hi-Vis Traffic
	{ supplier: 'portwest', styleCode: 'S480' }, // Pantalon Hi-Vis Traffic
	{ supplier: 'portwest', styleCode: 'ES046' }, // Pantalon de travail HV Essential

	// Tenues de service — espaces verts, ateliers, services généraux
	{ supplier: 'portwest', styleCode: 'B210' }, // Polo Naples
	{ supplier: 'portwest', styleCode: 'B209' }, // Polo femme Naples
	{ supplier: 'portwest', styleCode: 'B195' }, // T-shirt Premium Turin
	{ supplier: 'blaklader', styleCode: '362510421000' }, // T-shirts pack x5
	{ supplier: 'portwest', styleCode: 'B300' }, // Sweatshirt Roma
	{ supplier: 'portwest', styleCode: 'ES302' }, // Sweat à capuche Essential
	{ supplier: 'portwest', styleCode: 'TK20' }, // Softshell homme Print & Promo
	{ supplier: 'mascot', styleCode: '20439-230' }, // Pantalon très léger
	{ supplier: 'mascot', styleCode: '20254-442' }, // Veste

	// Pluie
	{ supplier: 'portwest', styleCode: 'S440' }, // Veste de pluie Classic
	{ supplier: 'portwest', styleCode: 'F440' }, // Veste de pluie Iona Classic
	{ supplier: 'mascot', styleCode: '20990-873' }, // Pantalon de pluie

	// Accessoires & protection
	{ supplier: 'portwest', styleCode: 'B010' }, // Casquette type baseball
	{ supplier: 'portwest', styleCode: 'B036' }, // Bonnet
	{ supplier: 'portwest', styleCode: 'A120' }, // Gant enduit PU
	{ supplier: 'portwest', styleCode: 'FW80' }, // Chaussure à lacets S2
];
