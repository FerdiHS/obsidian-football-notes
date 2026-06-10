import { normalizePath } from 'obsidian';

export const DEFAULT_MATCH_NOTES_FOLDER = 'Football notes/matches';

export function normalizeMatchNotesFolder(folder: string): string {
	const trimmedFolder = folder.trim();

	if (trimmedFolder.length === 0) {
		return DEFAULT_MATCH_NOTES_FOLDER;
	}

	const normalizedFolder = normalizePath(trimmedFolder).replace(/^\/+/, '');

	return normalizedFolder.length > 0 && normalizedFolder !== '.'
		? normalizedFolder
		: DEFAULT_MATCH_NOTES_FOLDER;
}

export interface MatchNoteInput {
	sourceUrl: string;
	destinationFolder: string;
}

export interface MatchNoteDraft {
	title: string;
	folder: string;
	content: string;
}
