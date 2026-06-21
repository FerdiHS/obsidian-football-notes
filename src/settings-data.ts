import { DEFAULT_MATCH_NOTES_FOLDER, normalizeMatchNotesFolder } from './types';

export interface FootballNotesSettings {
	notesFolder: string;
}

export const DEFAULT_SETTINGS: FootballNotesSettings = {
	notesFolder: DEFAULT_MATCH_NOTES_FOLDER,
};

export interface HydratedLoadedSettings {
	settings: FootballNotesSettings;
	shouldPersistNormalizedFolder: boolean;
}

export function hydrateLoadedSettings(loaded: unknown): HydratedLoadedSettings {
	const loadedIsRecord = isRecord(loaded);
	const loadedSettings = loadedIsRecord ? loaded : {};
	const rawNotesFolder =
		typeof loadedSettings.notesFolder === 'string'
			? loadedSettings.notesFolder
			: DEFAULT_SETTINGS.notesFolder;
	const notesFolder = normalizeMatchNotesFolder(rawNotesFolder);
	const shouldPersistNormalizedFolder =
		!loadedIsRecord ||
		(loadedSettings.notesFolder !== undefined &&
			(typeof loadedSettings.notesFolder !== 'string' ||
				loadedSettings.notesFolder !== notesFolder));

	return {
		settings: {
			notesFolder,
		},
		shouldPersistNormalizedFolder,
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
