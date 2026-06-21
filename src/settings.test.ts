import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_SETTINGS, hydrateLoadedSettings } from './settings-data';

void test('hydrateLoadedSettings falls back to the default for malformed notesFolder values', () => {
	const result = hydrateLoadedSettings({ notesFolder: 123 });

	assert.deepEqual(result.settings, {
		notesFolder: DEFAULT_SETTINGS.notesFolder,
	});
	assert.equal(result.shouldPersistNormalizedFolder, true);
});

void test('hydrateLoadedSettings preserves a trimmed notesFolder value and marks it for persistence', () => {
	const result = hydrateLoadedSettings({ notesFolder: '  Football notes/matches  ' });

	assert.deepEqual(result.settings, {
		notesFolder: 'Football notes/matches',
	});
	assert.equal(result.shouldPersistNormalizedFolder, true);
});

void test('hydrateLoadedSettings keeps the default notesFolder without forcing persistence when missing', () => {
	const result = hydrateLoadedSettings({});

	assert.deepEqual(result.settings, {
		notesFolder: DEFAULT_SETTINGS.notesFolder,
	});
	assert.equal(result.shouldPersistNormalizedFolder, false);
});
