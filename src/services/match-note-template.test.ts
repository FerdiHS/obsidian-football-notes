import assert from 'node:assert/strict';
import test from 'node:test';

import { createMatchNoteDraft } from './match-note-template';

void test('createMatchNoteDraft renders the canonical match note schema', () => {
	const draft = createMatchNoteDraft({
		source: {
			sourceUrl: 'https://example.com/match',
			sourceHost: 'example.com',
		},
		destinationFolder: ' Football notes/matches ',
	});

	assert.equal(draft.title, 'New match note');
	assert.equal(draft.folder, 'Football notes/matches');

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 5), [
		'---',
		'type: match-note',
		'sport: football',
		'source_url: "https://example.com/match"',
		'---',
	]);

	assert.deepEqual(lines.slice(5), [
		'',
		'# Match',
		'',
		'## Snapshot',
		'',
		'## Lineups',
		'',
		'## Match stats',
		'',
		'## Timeline',
		'',
		'## My observations',
		'',
		'## Tactical notes',
		'',
	]);
});

void test('createMatchNoteDraft rejects an empty source URL', () => {
	assert.throws(
		() =>
			createMatchNoteDraft({
				source: {
					sourceUrl: '   ',
					sourceHost: 'example.com',
				},
				destinationFolder: 'Football notes/matches',
			}),
		/Match note source URL cannot be empty\./,
	);
});

void test('createMatchNoteDraft normalizes the destination folder', () => {
	const draft = createMatchNoteDraft({
		source: {
			sourceUrl: 'https://example.com/match',
			sourceHost: 'example.com',
		},
		destinationFolder: '  Scratch/matches  ',
	});

	assert.equal(draft.folder, 'Scratch/matches');
});
