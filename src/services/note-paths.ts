import { normalizeVaultPath } from '../path-utils';
import { sanitizeNoteTitle } from './note-title';

const NOTE_FILE_EXTENSION = '.md';

export function toVaultRelativeNoteTarget(notePath: string): string {
	return normalizeVaultPath(notePath).replace(/\.md$/i, '');
}

export function createNamedNotePath(folder: string, title: string, attempt = 1): string {
	const normalizedFolder = normalizeVaultPath(folder).replace(/^\/+/, '');
	const normalizedTitle = sanitizeNoteTitle(title);

	if (normalizedTitle.length === 0) {
		throw new Error('Note title cannot be empty.');
	}

	const filename =
		attempt <= 1
			? `${normalizedTitle}${NOTE_FILE_EXTENSION}`
			: `${normalizedTitle} ${attempt}${NOTE_FILE_EXTENSION}`;

	return normalizeVaultPath(`${normalizedFolder}/${filename}`);
}

export function getFolderCreationChain(folder: string): string[] {
	const normalizedFolder = normalizeVaultPath(folder).replace(/^\/+/, '');

	if (normalizedFolder.length === 0 || normalizedFolder === '.' || normalizedFolder === '/') {
		return [];
	}

	return normalizedFolder
		.split('/')
		.map((_, index, segments) => segments.slice(0, index + 1).join('/'));
}
