import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME } from './commands/create-match-note-from-url';
import { CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME } from './commands/create-match-note-manually';
import { CREATE_PLAYER_NOTE_COMMAND_NAME } from './commands/create-player-note';
import { CREATE_TEAM_NOTE_COMMAND_NAME } from './commands/create-team-note';
import {
	DEFAULT_MATCH_NOTES_FOLDER,
	DEFAULT_PLAYER_NOTES_FOLDER,
	DEFAULT_TEAM_NOTES_FOLDER,
} from './types';

void test('README usage section documents the public contract', async () => {
	const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
	const headingIndex = (heading: string) => readme.search(new RegExp(`^${heading}$`, 'm'));
	const usageStart = headingIndex('## Usage');
	const developmentStart = headingIndex('## Development');
	const releasesStart = headingIndex('## Releases');
	const localTestingStart = headingIndex('## Local testing');

	assert.ok(usageStart >= 0);
	assert.ok(developmentStart > usageStart);
	assert.ok(releasesStart > developmentStart);
	assert.ok(localTestingStart > releasesStart);

	const usageSection = readme.slice(usageStart, developmentStart);
	const usageHeadings = [...usageSection.matchAll(/^### .+$/gm)].map((match) => match[0]);

	assert.deepEqual(usageHeadings, [
		'### Installation',
		'### Commands',
		'### Settings and generated notes',
		'### Limitations',
	]);
	assert.ok(
		usageSection.includes(
			'download `main.js` and `manifest.json` from the relevant GitHub release',
		),
	);
	assert.ok(
		usageSection.includes("If you're developing from source, use the direct-checkout workflow"),
	);
	assert.ok(!usageSection.includes('styles.css'));
	assert.ok(usageSection.includes(CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME));
	assert.ok(usageSection.includes(CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME));
	assert.ok(usageSection.includes(CREATE_TEAM_NOTE_COMMAND_NAME));
	assert.ok(usageSection.includes(CREATE_PLAYER_NOTE_COMMAND_NAME));
	assert.ok(usageSection.includes(DEFAULT_MATCH_NOTES_FOLDER));
	assert.ok(usageSection.includes(DEFAULT_TEAM_NOTES_FOLDER));
	assert.ok(usageSection.includes(DEFAULT_PLAYER_NOTES_FOLDER));
	assert.ok(usageSection.includes('docs/match-note-schema.md'));
	assert.ok(usageSection.includes('docs/team-player-note-schema.md'));
	assert.ok(
		usageSection.includes(
			'Existing compatible team and player notes are reused instead of duplicated.',
		),
	);
	assert.ok(
		usageSection.includes(
			'Match notes are not reused solely because a generated path is occupied; the plugin chooses an available filename instead.',
		),
	);
	assert.ok(
		usageSection.includes(
			'The plugin avoids overwriting existing notes and reports folder or incompatible-note collisions clearly.',
		),
	);
	assert.ok(
		usageSection.includes(
			'Manual match note home and away teams must be different. Names that resolve to the same sanitized, case-insensitive team-note path are rejected.',
		),
	);
	assert.ok(
		usageSection.includes(
			'It does not fetch teams, scores, dates, lineups, statistics, or provider data.',
		),
	);
	assert.ok(usageSection.includes('automatic player creation from matches'));
});
