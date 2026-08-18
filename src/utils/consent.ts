export const CONSENT_STORAGE_KEY = 'protex-epi-cookie-consent';
export const CONSENT_CHANGED_EVENT = 'protex-epi:consent-changed';

export interface ConsentPrefs {
	functional: true;
	marketing: boolean;
	performance: boolean;
	analytics: boolean;
	decidedAt: number;
}

export function getStoredConsent(): ConsentPrefs | null {
	try {
		const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
		return raw ? (JSON.parse(raw) as ConsentPrefs) : null;
	} catch {
		return null;
	}
}
