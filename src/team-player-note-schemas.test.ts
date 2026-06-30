import assert from 'node:assert/strict';
import test from 'node:test';

import { PLAYER_NOTE_SCHEMA, TEAM_NOTE_SCHEMA } from './team-player-note-schemas';

void test('team and player note schemas match the documented contract', () => {
	assert.deepEqual(TEAM_NOTE_SCHEMA.frontmatter.required, ['type', 'sport', 'team_name']);
	assert.deepEqual(TEAM_NOTE_SCHEMA.frontmatter.optional, [
		'country',
		'league',
		'aliases',
		'tags',
	]);
	assert.deepEqual(TEAM_NOTE_SCHEMA.bodySections, [
		'# Team Name',
		'## Overview',
		'## Matches',
		'## Players',
		'## Notes',
	]);

	assert.deepEqual(PLAYER_NOTE_SCHEMA.frontmatter.required, ['type', 'sport', 'player_name']);
	assert.deepEqual(PLAYER_NOTE_SCHEMA.frontmatter.optional, [
		'team',
		'position',
		'country',
		'aliases',
		'tags',
	]);
	assert.deepEqual(PLAYER_NOTE_SCHEMA.bodySections, [
		'# Player Name',
		'## Overview',
		'## Teams',
		'## Matches',
		'## Notes',
	]);
});
