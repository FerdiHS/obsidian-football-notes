import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_SETTINGS, hydrateLoadedSettings } from './settings-data';

void test('hydrateLoadedSettings falls back to the default for malformed notesFolder values', () => {
	const result = hydrateLoadedSettings({ notesFolder: 123 });

	assert.deepEqual(result.settings, {
		notesFolder: DEFAULT_SETTINGS.notesFolder,
		teamNotesFolder: DEFAULT_SETTINGS.teamNotesFolder,
		playerNotesFolder: DEFAULT_SETTINGS.playerNotesFolder,
	});
	assert.equal(result.shouldPersistNormalizedSettings, true);
});

void test('hydrateLoadedSettings repairs malformed root settings values', () => {
	for (const malformedRoot of [null, [], 'bad']) {
		const result = hydrateLoadedSettings(malformedRoot);

		assert.deepEqual(result.settings, {
			notesFolder: DEFAULT_SETTINGS.notesFolder,
			teamNotesFolder: DEFAULT_SETTINGS.teamNotesFolder,
			playerNotesFolder: DEFAULT_SETTINGS.playerNotesFolder,
		});
		assert.equal(result.shouldPersistNormalizedSettings, true);
	}
});

void test('hydrateLoadedSettings preserves trimmed folder values and marks them for persistence', () => {
	const result = hydrateLoadedSettings({
		notesFolder: '  Football notes/matches  ',
		teamNotesFolder: '  Football notes/teams  ',
		playerNotesFolder: '  Football notes/players  ',
	});

	assert.deepEqual(result.settings, {
		notesFolder: 'Football notes/matches',
		teamNotesFolder: 'Football notes/teams',
		playerNotesFolder: 'Football notes/players',
	});
	assert.equal(result.shouldPersistNormalizedSettings, true);
});

void test('hydrateLoadedSettings migrates legacy match-only settings and marks them for persistence', () => {
	const result = hydrateLoadedSettings({ notesFolder: DEFAULT_SETTINGS.notesFolder });

	assert.deepEqual(result.settings, {
		notesFolder: DEFAULT_SETTINGS.notesFolder,
		teamNotesFolder: DEFAULT_SETTINGS.teamNotesFolder,
		playerNotesFolder: DEFAULT_SETTINGS.playerNotesFolder,
	});
	assert.equal(result.shouldPersistNormalizedSettings, true);
});

void test('hydrateLoadedSettings keeps the default settings without forcing persistence when already complete', () => {
	const result = hydrateLoadedSettings({
		notesFolder: DEFAULT_SETTINGS.notesFolder,
		teamNotesFolder: DEFAULT_SETTINGS.teamNotesFolder,
		playerNotesFolder: DEFAULT_SETTINGS.playerNotesFolder,
	});

	assert.deepEqual(result.settings, {
		notesFolder: DEFAULT_SETTINGS.notesFolder,
		teamNotesFolder: DEFAULT_SETTINGS.teamNotesFolder,
		playerNotesFolder: DEFAULT_SETTINGS.playerNotesFolder,
	});
	assert.equal(result.shouldPersistNormalizedSettings, false);
});
