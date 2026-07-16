import { normalizeVaultPath } from './path-utils';

export const DEFAULT_MATCH_NOTES_FOLDER = 'Football notes/matches';
export const DEFAULT_TEAM_NOTES_FOLDER = 'Football notes/teams';
export const DEFAULT_PLAYER_NOTES_FOLDER = 'Football notes/players';

export interface MatchUrl {
	sourceUrl: string;
	sourceHost: string;
}

export function normalizeMatchNotesFolder(folder: string): string {
	return normalizeNotesFolder(folder, DEFAULT_MATCH_NOTES_FOLDER);
}

export function normalizeTeamNotesFolder(folder: string): string {
	return normalizeNotesFolder(folder, DEFAULT_TEAM_NOTES_FOLDER);
}

export function normalizePlayerNotesFolder(folder: string): string {
	return normalizeNotesFolder(folder, DEFAULT_PLAYER_NOTES_FOLDER);
}

function normalizeNotesFolder(folder: string, defaultFolder: string): string {
	const trimmedFolder = folder.trim();

	if (trimmedFolder.length === 0) {
		return defaultFolder;
	}

	if (containsParentDirectorySegment(trimmedFolder)) {
		return defaultFolder;
	}

	const normalizedFolder = normalizeVaultPath(trimmedFolder).replace(/^\/+/, '');

	return normalizedFolder.length > 0 && normalizedFolder !== '.'
		? normalizedFolder
		: defaultFolder;
}

function containsParentDirectorySegment(folder: string): boolean {
	return folder.split(/[\\/]/).some((segment) => segment === '..');
}

export interface MatchNoteInput {
	source: MatchUrl;
	destinationFolder: string;
}

export interface ManualMatchNoteInput {
	destinationFolder: string;
	homeTeam: string;
	awayTeam: string;
	matchDate: string;
	competition: string;
	source?: MatchUrl;
}

export interface ManualMatchNoteSubmission {
	homeTeam: string;
	awayTeam: string;
	matchDate: string;
	competition: string;
	sourceUrl?: string;
}

export interface MatchNoteDraft {
	title: string;
	folder: string;
	content: string;
}
