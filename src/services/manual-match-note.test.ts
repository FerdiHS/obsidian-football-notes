import assert from 'node:assert/strict';
import test from 'node:test';

import { createManualMatchNoteWorkflow } from './manual-match-note';

void test('createManualMatchNoteWorkflow creates and opens a manual match note', async () => {
	const notices: string[] = [];
	const createdInputs: Array<{
		destinationFolder: string;
		homeTeam: string;
		awayTeam: string;
		homeTeamNotePath: string;
		awayTeamNotePath: string;
		matchDate: string;
		competition: string;
		sourceUrl?: string;
	}> = [];
	const openedFiles: Array<{ name: string }> = [];
	const resolvedTeamNotes: Array<{ homeTeam: string; awayTeam: string }> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async (input) => {
				resolvedTeamNotes.push(input);

				return {
					homeTeam: {
						notePath: 'Football notes/teams/Real Madrid',
						existedAlready: false,
						fileName: 'Real Madrid.md',
					},
					awayTeam: {
						notePath: 'Football notes/teams/Barcelona',
						existedAlready: true,
						fileName: 'Barcelona.md',
					},
				};
			},
			createMatchNoteFile: async (input) => {
				createdInputs.push({
					destinationFolder: input.destinationFolder,
					homeTeam: input.homeTeam,
					awayTeam: input.awayTeam,
					homeTeamNotePath: input.homeTeamNotePath,
					awayTeamNotePath: input.awayTeamNotePath,
					matchDate: input.matchDate,
					competition: input.competition,
					sourceUrl: input.source?.sourceUrl,
				});

				return {
					name: 'Real Madrid vs Barcelona 2026-07-01.md',
				};
			},
			openMatchNote: async (file) => {
				openedFiles.push(file);
			},
			showNotice: (message) => {
				notices.push(message);
			},
			logError: (message, error) => {
				throw new Error(`${message}: ${(error as Error).message}`);
			},
		},
	);

	assert.equal(result, true);
	assert.deepEqual(resolvedTeamNotes, [
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
		},
	]);
	assert.deepEqual(createdInputs, [
		{
			destinationFolder: 'Football notes/matches',
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			homeTeamNotePath: 'Football notes/teams/Real Madrid',
			awayTeamNotePath: 'Football notes/teams/Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
			sourceUrl: undefined,
		},
	]);
	assert.deepEqual(openedFiles, [{ name: 'Real Madrid vs Barcelona 2026-07-01.md' }]);
	assert.deepEqual(notices, [
		'Created home team note: Real Madrid.md',
		'Reused existing away team note: Barcelona.md',
		'Created match note: Real Madrid vs Barcelona 2026-07-01.md',
	]);
});

void test('createManualMatchNoteWorkflow shows the parser error for invalid optional source URLs', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
			sourceUrl: 'https://user@example.com/match',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error('should not be called');
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		['notice', 'Match URL cannot include embedded username or password.'],
	]);
});

void test('createManualMatchNoteWorkflow rejects empty manual fields', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: ' ',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error('should not be called');
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [['notice', 'Manual match note away team cannot be empty.']]);
});

void test('createManualMatchNoteWorkflow rejects invalid manual match dates', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-02-31',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error('should not be called');
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		[
			'notice',
			'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
		],
	]);
});

void test('createManualMatchNoteWorkflow rejects match teams that normalize to empty wiki link targets', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: '.',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error('should not be called');
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		['notice', 'Manual match note home team cannot become a valid wiki link target.'],
	]);
});

void test('createManualMatchNoteWorkflow reports team note resolution failures', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error(
					'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a non-team file.',
				);
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		[
			'error',
			'Failed to resolve manual match team notes.',
			'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a non-team file.',
		],
		[
			'notice',
			'Could not resolve team notes: Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a non-team file.',
		],
	]);
});

void test('createManualMatchNoteWorkflow surfaces known team resolution collisions', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				throw new Error(
					'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists for a different team note.',
				);
			},
			createMatchNoteFile: async () => {
				throw new Error('should not be called');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		[
			'error',
			'Failed to resolve manual match team notes.',
			'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists for a different team note.',
		],
		[
			'notice',
			'Could not resolve team notes: Cannot create team note because "Football notes/teams/Real Madrid.md" already exists for a different team note.',
		],
	]);
});

void test('createManualMatchNoteWorkflow keeps created team notes when match note creation fails', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				return {
					homeTeam: {
						notePath: 'Football notes/teams/Real Madrid',
						existedAlready: false,
						fileName: 'Real Madrid.md',
					},
					awayTeam: {
						notePath: 'Football notes/teams/Barcelona',
						existedAlready: true,
						fileName: 'Barcelona.md',
					},
				};
			},
			createMatchNoteFile: async () => {
				throw new Error('match note create failed');
			},
			openMatchNote: async () => {
				throw new Error('should not be called');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, false);
	assert.deepEqual(calls, [
		['error', 'Failed to create manual match note.', 'match note create failed'],
		[
			'notice',
			'Could not create match note. Some team notes may have been created and left in the vault. See console for details.',
		],
	]);
});

void test('createManualMatchNoteWorkflow reports open failures after successful creation', async () => {
	const calls: Array<unknown> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			resolveTeamNotes: async () => {
				return {
					homeTeam: {
						notePath: 'Football notes/teams/Real Madrid',
						existedAlready: true,
						fileName: 'Real Madrid.md',
					},
					awayTeam: {
						notePath: 'Football notes/teams/Barcelona',
						existedAlready: true,
						fileName: 'Barcelona.md',
					},
				};
			},
			createMatchNoteFile: async () => {
				return {
					name: 'Real Madrid vs Barcelona 2026-07-01.md',
				};
			},
			openMatchNote: async () => {
				throw new Error('cannot open file');
			},
			showNotice: (message) => {
				calls.push(['notice', message]);
			},
			logError: (message, error) => {
				calls.push(['error', message, (error as Error).message]);
			},
		},
	);

	assert.equal(result, true);
	assert.deepEqual(calls, [
		['notice', 'Reused existing home team note: Real Madrid.md'],
		['notice', 'Reused existing away team note: Barcelona.md'],
		['error', 'Created match note, but could not open it.', 'cannot open file'],
		[
			'notice',
			'Created match note: Real Madrid vs Barcelona 2026-07-01.md, but could not open it automatically.',
		],
	]);
});
