// Rendu des pastilles de coloris en CSS pur : les photos produit CDN pleine
// résolution coûtaient jusqu'à 120 téléchargements par page de listing pour
// peindre des points de 24px. Le nom de couleur fournisseur (français) est
// mappé sur une teinte approchante ; inconnu → gris neutre, le title de la
// pastille porte de toute façon le nom exact.
// Ordre important : les entrées les plus spécifiques d'abord (première
// occurrence contenue dans le libellé gagne).
const COLOUR_KEYWORDS: [string, string][] = [
	['jaune fluo', '#d6f000'],
	['hi-vis jaune', '#d6f000'],
	['orange fluo', '#ff6a00'],
	['hi-vis orange', '#ff6a00'],
	['rouge fluo', '#ff2d2d'],
	['hi-vis rouge', '#ff2d2d'],
	['marine', '#1f2a44'],
	['navy', '#1f2a44'],
	['bleu roi', '#2e5cb8'],
	['bleu royal', '#2e5cb8'],
	['royal', '#2e5cb8'],
	['bleu ciel', '#8fc1e8'],
	['bleu pétrole', '#175e63'],
	['bleu olympien', '#264a86'],
	['bleu-gris', '#6b7f95'],
	['bleu', '#2e5cb8'],
	['anthracite', '#3a3d40'],
	['gris clair', '#c9ccce'],
	['gris acier', '#9aa0a4'],
	['gris', '#8a8f93'],
	['chiné', '#9aa0a4'],
	['noir', '#161616'],
	['blanc', '#fafafa'],
	['bordeaux', '#5e1f2c'],
	['rouille', '#a04a24'],
	['rouge', '#c02428'],
	['jaune curry', '#c9a227'],
	['jaune', '#f4c800'],
	['orange', '#e87511'],
	['vert bouteille', '#1e4a35'],
	['vert forêt', '#22492f'],
	['forêt', '#22492f'],
	['vert gazon', '#3a8f3d'],
	['kaki', '#6a6a45'],
	['vert mousse', '#7a8450'],
	['vert menthe', '#79c7ab'],
	['olive', '#5f6134'],
	['vert', '#2f7a3d'],
	['sable', '#d8c49a'],
	['beige', '#d8c49a'],
	['noisette', '#5b4232'],
	['brun', '#5b4232'],
	['marron', '#5b4232'],
	['bronze', '#7a5c3a'],
	['incolore', '#f2f4f6'],
	['fumé', '#7d7f83'],
	['argent', '#c8c8c8'],
	['rose', '#e78fb3'],
	['violet', '#6a4d8f'],
];

const FALLBACK = '#e5e7eb';

function partToHex(part: string): string {
	const label = part.trim().toLowerCase();
	for (const [keyword, hex] of COLOUR_KEYWORDS) {
		if (label.includes(keyword)) return hex;
	}
	return FALLBACK;
}

/** Valeur CSS `background` pour la pastille d'un coloris ("Marine", "Jaune fluo/Marine"…). */
export function colourToCss(colour: string): string {
	const parts = colour
		.split('/')
		.map((part) => part.trim())
		.filter(Boolean)
		.slice(0, 2);
	if (parts.length === 0) return FALLBACK;
	if (parts.length === 1) return partToHex(parts[0]);
	const [a, b] = parts.map(partToHex);
	return `linear-gradient(135deg, ${a} 0%, ${a} 50%, ${b} 50%, ${b} 100%)`;
}
