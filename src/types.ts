export const DEFAULT_MATCH_NOTES_FOLDER = 'Football notes/matches';

export interface MatchNoteInput {
	sourceUrl: string;
	destinationFolder: string;
}

export interface MatchNoteDraft {
	title: string;
	folder: string;
	content: string;
}
