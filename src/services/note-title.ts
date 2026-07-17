export function sanitizeNoteTitle(title: string): string {
	return title
		.trim()
		.replace(/[\\/:*?"<>|#^]/g, '-')
		.replace(/\s+/g, ' ')
		.replace(/[. ]+$/u, '');
}

export function normalizeNoteTitle(title: string): string {
	const normalizedTitle = sanitizeNoteTitle(title);

	return normalizedTitle.length > 0 ? normalizedTitle : 'New match note';
}
