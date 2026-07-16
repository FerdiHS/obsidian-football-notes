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
		homeTeamNotePath: 'Football notes/teams/Real Madrid',
		awayTeamNotePath: 'Football notes/teams/Barcelona',
		matchDate: '2026-07-01',
		competition: 'La Liga',
	});

	assert.equal(draft.title, 'Real Madrid vs Barcelona 2026-07-01');
	assert.equal(draft.folder, 'Football notes/matches');

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 6), [
		'---',
		'type: match-note',
		'sport: football',
		'home_team_note: "Football notes/teams/Real Madrid"',
		'away_team_note: "Football notes/teams/Barcelona"',
		'---',
	]);
	assert.deepEqual(lines.slice(6), [
		'',
		'# Match',
		'',
		'## Snapshot',
		'',
		'- Home team: [[Football notes/teams/Real Madrid]]',
		'- Away team: [[Football notes/teams/Barcelona]]',
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
		homeTeamNotePath: 'Football notes/teams/Real Madrid',
		awayTeamNotePath: 'Football notes/teams/Barcelona',
		matchDate: '2026-07-01',
		competition: 'La Liga',
		source: {
			sourceUrl: ' https://example.com/match ',
			sourceHost: 'example.com',
		},
	});

	const lines = draft.content.split('\n');

	assert.deepEqual(lines.slice(0, 7), [
		'---',
		'type: match-note',
		'sport: football',
		'home_team_note: "Football notes/teams/Real Madrid"',
		'away_team_note: "Football notes/teams/Barcelona"',
		'source_url: "https://example.com/match"',
		'---',
	]);
	assert.ok(lines.includes('- Source URL: https://example.com/match'));
});

void test('createManualMatchNoteDraft preserves the provided team note paths', () => {
	const draft = createManualMatchNoteDraft({
		destinationFolder: 'Football notes/matches',
		homeTeam: 'Real Madrid',
		awayTeam: 'Barcelona',
		homeTeamNotePath: 'Football notes/teams/Real Madrid',
		awayTeamNotePath: 'Football notes/teams/Barcelona',
		matchDate: '2026-07-01',
		competition: 'La Liga',
	});

	assert.match(draft.content, /home_team_note: "Football notes\/teams\/Real Madrid"/);
	assert.match(draft.content, /away_team_note: "Football notes\/teams\/Barcelona"/);
	assert.match(draft.content, /- Home team: \[\[Football notes\/teams\/Real Madrid\]\]/);
	assert.match(draft.content, /- Away team: \[\[Football notes\/teams\/Barcelona\]\]/);
});

void test('createManualMatchNoteDraft escapes wiki link targets for special characters', () => {
	const draft = createManualMatchNoteDraft({
		destinationFolder: 'Football notes/matches',
		homeTeam: 'Foo',
		awayTeam: 'Baz',
		homeTeamNotePath: 'Football notes/teams/Foo[Bar]',
		awayTeamNotePath: 'Football notes/teams/Baz#Qux',
		matchDate: '2026-07-01',
		competition: 'Friendly',
	});

	assert.ok(draft.content.includes('- Home team: [[Football notes/teams/Foo\\[Bar\\]]]'));
	assert.ok(draft.content.includes('- Away team: [[Football notes/teams/Baz\\#Qux]]'));
});

void test('createManualMatchNoteDraft rejects empty manual fields', () => {
	assert.throws(
		() =>
			createManualMatchNoteDraft({
				destinationFolder: 'Football notes/matches',
				homeTeam: 'Real Madrid',
				awayTeam: ' ',
				homeTeamNotePath: 'Football notes/teams/Real Madrid',
				awayTeamNotePath: 'Football notes/teams/Barcelona',
				matchDate: '2026-07-01',
				competition: 'La Liga',
			}),
		/Manual match note away team cannot be empty\./,
	);
});

void test('createManualMatchNoteDraft rejects invalid manual match dates', () => {
	assert.throws(
		() =>
			createManualMatchNoteDraft({
				destinationFolder: 'Football notes/matches',
				homeTeam: 'Real Madrid',
				awayTeam: 'Barcelona',
				homeTeamNotePath: 'Football notes/teams/Real Madrid',
				awayTeamNotePath: 'Football notes/teams/Barcelona',
				matchDate: '2026-02-31',
				competition: 'La Liga',
			}),
		/Manual match note match date must use YYYY-MM-DD and be a valid calendar date\./,
	);
});

void test('createManualMatchNoteDraft rejects team names that normalize to empty wiki-link targets', () => {
	assert.throws(
		() =>
			createManualMatchNoteDraft({
				destinationFolder: 'Football notes/matches',
				homeTeam: '.',
				awayTeam: 'Barcelona',
				homeTeamNotePath: 'Football notes/teams/Real Madrid',
				awayTeamNotePath: 'Football notes/teams/Barcelona',
				matchDate: '2026-07-01',
				competition: 'La Liga',
			}),
		/Manual match note home team cannot become a valid wiki link target\./,
	);
});
