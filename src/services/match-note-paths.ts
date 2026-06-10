import { normalizePath } from 'obsidian';

const MATCH_NOTE_FILE_EXTENSION = '.md';

export function createMatchNoteTimestamp(now: Date): string {
	return [
		now.getFullYear().toString().padStart(4, '0'),
		'-',
		(now.getMonth() + 1).toString().padStart(2, '0'),
		'-',
		now.getDate().toString().padStart(2, '0'),
		' ',
		now.getHours().toString().padStart(2, '0'),
		'-',
		now.getMinutes().toString().padStart(2, '0'),
		'-',
		now.getSeconds().toString().padStart(2, '0'),
	].join('');
}

export function createMatchNoteFilename(title: string, now: Date): string {
	return `${title} ${createMatchNoteTimestamp(now)}${MATCH_NOTE_FILE_EXTENSION}`;
}

export function createMatchNoteCandidateFilename(
	title: string,
	now: Date,
	attempt: number,
): string {
	const baseFilename = createMatchNoteFilename(title, now);

	if (attempt <= 1) {
		return baseFilename;
	}

	const suffix = ` ${attempt}`;

	return baseFilename.replace(MATCH_NOTE_FILE_EXTENSION, `${suffix}${MATCH_NOTE_FILE_EXTENSION}`);
}

export function createMatchNotePath(folder: string, title: string, now: Date, attempt = 1): string {
	return normalizePath(`${folder}/${createMatchNoteCandidateFilename(title, now, attempt)}`);
}

export function getFolderCreationChain(folder: string): string[] {
	const normalizedFolder = normalizePath(folder);

	if (normalizedFolder === '.' || normalizedFolder === '/') {
		return [];
	}

	return normalizedFolder
		.split('/')
		.map((_, index, segments) => segments.slice(0, index + 1).join('/'));
}
