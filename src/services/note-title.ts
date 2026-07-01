export function normalizeNoteTitle(title: string): string {
	const normalizedTitle = title
		.trim()
		.replace(/[\\/:*?"<>|]/g, '-')
		.replace(/\s+/g, ' ')
		.replace(/[. ]+$/u, '');

	return normalizedTitle.length > 0 ? normalizedTitle : 'New match note';
}
