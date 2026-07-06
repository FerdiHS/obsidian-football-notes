import assert from 'node:assert/strict';
import test from 'node:test';

import { createPlayerNoteDraft, createTeamNoteDraft } from './team-player-note-template';

void test('createTeamNoteDraft renders the canonical team note schema', () => {
	const draft = createTeamNoteDraft({
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(draft.title, 'Real Madrid');
	assert.equal(draft.folder, 'Football notes/teams');

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 5), [
		'---',
		'type: team-note',
		'sport: football',
		'team_name: "Real Madrid"',
		'---',
	]);

	assert.deepEqual(lines.slice(5), [
		'',
		'# Team Name',
		'',
		'## Overview',
		'',
		'## Matches',
		'',
		'## Players',
		'',
		'## Notes',
		'',
	]);
});

void test('createPlayerNoteDraft renders the canonical player note schema', () => {
	const draft = createPlayerNoteDraft({
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	assert.equal(draft.title, 'Lamine Yamal');
	assert.equal(draft.folder, 'Football notes/players');

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 5), [
		'---',
		'type: player-note',
		'sport: football',
		'player_name: "Lamine Yamal"',
		'---',
	]);

	assert.deepEqual(lines.slice(5), [
		'',
		'# Player Name',
		'',
		'## Overview',
		'',
		'## Teams',
		'',
		'## Matches',
		'',
		'## Notes',
		'',
	]);
});

void test('createTeamNoteDraft rejects empty team names after sanitization', () => {
	assert.throws(
		() =>
			createTeamNoteDraft({
				destinationFolder: 'Football notes/teams',
				name: '...',
			}),
		/Manual team note name cannot be empty\./,
	);
});

void test('createTeamNoteDraft preserves the display name while sanitizing the file title', () => {
	const draft = createTeamNoteDraft({
		destinationFolder: 'Football notes/teams',
		name: ' Foo/Bar ',
	});

	assert.equal(draft.title, 'Foo-Bar');
	assert.match(draft.content, /team_name: "Foo\/Bar"/);
});

void test('createPlayerNoteDraft rejects empty player names after sanitization', () => {
	assert.throws(
		() =>
			createPlayerNoteDraft({
				destinationFolder: 'Football notes/players',
				name: '...',
			}),
		/Manual player note name cannot be empty\./,
	);
});
