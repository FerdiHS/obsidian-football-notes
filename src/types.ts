export const DEFAULT_MATCH_NOTES_FOLDER = 'Football notes/matches';

export function normalizeMatchNotesFolder(folder: string): string {
	const trimmedFolder = folder.trim();

	return trimmedFolder.length > 0 ? trimmedFolder : DEFAULT_MATCH_NOTES_FOLDER;
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
