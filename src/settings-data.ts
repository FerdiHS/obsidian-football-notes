import {
	DEFAULT_MATCH_NOTES_FOLDER,
	DEFAULT_PLAYER_NOTES_FOLDER,
	DEFAULT_TEAM_NOTES_FOLDER,
	normalizeMatchNotesFolder,
	normalizePlayerNotesFolder,
	normalizeTeamNotesFolder,
} from './types';

export interface FootballNotesSettings {
	notesFolder: string;
	teamNotesFolder: string;
	playerNotesFolder: string;
}

export const DEFAULT_SETTINGS: FootballNotesSettings = {
	notesFolder: DEFAULT_MATCH_NOTES_FOLDER,
	teamNotesFolder: DEFAULT_TEAM_NOTES_FOLDER,
	playerNotesFolder: DEFAULT_PLAYER_NOTES_FOLDER,
};

export interface HydratedLoadedSettings {
	settings: FootballNotesSettings;
	shouldPersistNormalizedSettings: boolean;
}

export function hydrateLoadedSettings(loaded: unknown): HydratedLoadedSettings {
	const loadedIsRecord = isRecord(loaded);
	const loadedSettings = loadedIsRecord ? loaded : ({} as Record<string, unknown>);
	const notesFolder = normalizeLoadedFolder(
		loadedSettings.notesFolder,
		DEFAULT_SETTINGS.notesFolder,
		normalizeMatchNotesFolder,
	);
	const teamNotesFolder = normalizeLoadedFolder(
		loadedSettings.teamNotesFolder,
		DEFAULT_SETTINGS.teamNotesFolder,
		normalizeTeamNotesFolder,
	);
	const playerNotesFolder = normalizeLoadedFolder(
		loadedSettings.playerNotesFolder,
		DEFAULT_SETTINGS.playerNotesFolder,
		normalizePlayerNotesFolder,
	);
	const shouldPersistNormalizedSettings =
		!loadedIsRecord ||
		shouldPersistFolderValue(loadedSettings.notesFolder, notesFolder) ||
		shouldPersistFolderValue(loadedSettings.teamNotesFolder, teamNotesFolder) ||
		shouldPersistFolderValue(loadedSettings.playerNotesFolder, playerNotesFolder);

	return {
		settings: {
			notesFolder,
			teamNotesFolder,
			playerNotesFolder,
		},
		shouldPersistNormalizedSettings,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeLoadedFolder(
	rawFolder: unknown,
	defaultFolder: string,
	normalizeFolder: (folder: string) => string,
): string {
	return typeof rawFolder === 'string' ? normalizeFolder(rawFolder) : defaultFolder;
}

function shouldPersistFolderValue(rawFolder: unknown, normalizedFolder: string): boolean {
	return typeof rawFolder !== 'string' || rawFolder !== normalizedFolder;
}
