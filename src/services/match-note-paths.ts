import { normalizeMatchNotesFolder } from '../types';
import { normalizeVaultPath } from '../path-utils';
import { normalizeNoteTitle } from './note-title';

const MATCH_NOTE_FILE_EXTENSION = '.md';

export function createMatchNoteTimestamp(now: Date): string {
	return [
		padNumber(now.getFullYear(), 4),
		'-',
		padNumber(now.getMonth() + 1, 2),
		'-',
		padNumber(now.getDate(), 2),
		' ',
		padNumber(now.getHours(), 2),
		'-',
		padNumber(now.getMinutes(), 2),
		'-',
		padNumber(now.getSeconds(), 2),
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
	const baseName = baseFilename.slice(0, -MATCH_NOTE_FILE_EXTENSION.length);

	return `${baseName}${suffix}${MATCH_NOTE_FILE_EXTENSION}`;
}

export function createMatchNotePath(folder: string, title: string, now: Date, attempt = 1): string {
	const normalizedFolder = normalizeMatchNotesFolder(folder);
	const normalizedTitle = normalizeNoteTitle(title);

	return normalizeVaultPath(
		`${normalizedFolder}/${createMatchNoteCandidateFilename(normalizedTitle, now, attempt)}`,
	);
}

export function getFolderCreationChain(folder: string): string[] {
	const normalizedFolder = normalizeMatchNotesFolder(folder);

	if (normalizedFolder === '.' || normalizedFolder === '/') {
		return [];
	}

	return normalizedFolder
		.split('/')
		.map((_, index, segments) => segments.slice(0, index + 1).join('/'));
}

function padNumber(value: number, width: number): string {
	const valueString = value.toString();

	if (valueString.length >= width) {
		return valueString;
	}

	return `${'0000'.slice(0, width - valueString.length)}${valueString}`;
}
