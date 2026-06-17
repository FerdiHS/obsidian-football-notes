import { normalizePath } from 'obsidian';

export const DEFAULT_MATCH_NOTES_FOLDER = 'Football notes/matches';

export interface MatchUrl {
	sourceUrl: string;
	sourceHost: string;
}

export function normalizeMatchNotesFolder(folder: string): string {
	const trimmedFolder = folder.trim();

	if (trimmedFolder.length === 0) {
		return DEFAULT_MATCH_NOTES_FOLDER;
	}

	if (containsParentDirectorySegment(trimmedFolder)) {
		return DEFAULT_MATCH_NOTES_FOLDER;
	}

	const normalizedFolder = normalizePath(trimmedFolder).replace(/^\/+/, '');

	return normalizedFolder.length > 0 && normalizedFolder !== '.'
		? normalizedFolder
		: DEFAULT_MATCH_NOTES_FOLDER;
}

function containsParentDirectorySegment(folder: string): boolean {
	return folder.split(/[\\/]/).some((segment) => segment === '..');
}

export interface MatchNoteInput {
	source: MatchUrl;
	destinationFolder: string;
}

export interface MatchNoteDraft {
	title: string;
	folder: string;
	content: string;
}
