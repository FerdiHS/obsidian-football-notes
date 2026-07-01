import assert from 'node:assert/strict';
import test from 'node:test';

import { createManualMatchNoteDraft, createMatchNoteDraft } from './match-note-template';

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

void test('createManualMatchNoteDraft renders a source-free manual match note', () => {
	const draft = createManualMatchNoteDraft({
		destinationFolder: ' Football notes/matches ',
		homeTeam: 'Real Madrid',
		awayTeam: 'Barcelona',
		matchDate: '2026-07-01',
		competition: 'La Liga',
	});

	assert.equal(draft.title, 'Real Madrid vs Barcelona 2026-07-01');
	assert.equal(draft.folder, 'Football notes/matches');

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 4), ['---', 'type: match-note', 'sport: football', '---']);
	assert.deepEqual(lines.slice(4), [
		'',
		'# Match',
		'',
		'## Snapshot',
		'',
		'- Home team: [[Real Madrid]]',
		'- Away team: [[Barcelona]]',
		'- Match date: 2026-07-01',
		'- Competition: La Liga',
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

void test('createManualMatchNoteDraft includes a provided source URL', () => {
	const draft = createManualMatchNoteDraft({
		destinationFolder: 'Football notes/matches',
		homeTeam: 'Real Madrid',
		awayTeam: 'Barcelona',
		matchDate: '2026-07-01',
		competition: 'La Liga',
		source: {
			sourceUrl: ' https://example.com/match ',
			sourceHost: 'example.com',
		},
	});

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 5), [
		'---',
		'type: match-note',
		'sport: football',
		'source_url: "https://example.com/match"',
		'---',
	]);
	assert.ok(lines.includes('- Source URL: https://example.com/match'));
});

void test('createManualMatchNoteDraft sanitizes wiki link targets for special characters', () => {
	const draft = createManualMatchNoteDraft({
		destinationFolder: 'Football notes/matches',
		homeTeam: 'Foo/Bar',
		awayTeam: 'Baz',
		matchDate: '2026-07-01',
		competition: 'Friendly',
	});

	assert.match(draft.content, /- Home team: \[\[Foo-Bar\|Foo\/Bar\]\]/);
	assert.match(draft.content, /- Away team: \[\[Baz\]\]/);
});

void test('createManualMatchNoteDraft rejects empty manual fields', () => {
	assert.throws(
		() =>
			createManualMatchNoteDraft({
				destinationFolder: 'Football notes/matches',
				homeTeam: 'Real Madrid',
				awayTeam: ' ',
				matchDate: '2026-07-01',
				competition: 'La Liga',
			}),
		/Manual match note away team cannot be empty\./,
	);
});
