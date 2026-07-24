const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(COMBINING_DIACRITICS, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
