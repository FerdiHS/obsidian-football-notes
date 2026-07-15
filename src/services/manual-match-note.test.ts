import assert from 'node:assert/strict';
import test from 'node:test';

import { createManualMatchNoteWorkflow } from './manual-match-note';
import type { ManualMatchNoteSubmission } from '../types';

void test('createManualMatchNoteWorkflow creates and opens a manual match note', async () => {
	const notices: string[] = [];
	const createdInputs: Array<ManualMatchNoteSubmission & { destinationFolder: string }> = [];
	const openedFiles: Array<{ name: string }> = [];

	const result = await createManualMatchNoteWorkflow(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
		},
		{
			destinationFolder: 'Football notes/matches',
			createMatchNoteFile: async (input) => {
				createdInputs.push({
					destinationFolder: input.destinationFolder,
					homeTeam: input.homeTeam,
					awayTeam: input.awayTeam,
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
	assert.deepEqual(createdInputs, [
		{
			destinationFolder: 'Football notes/matches',
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
			matchDate: '2026-07-01',
			competition: 'La Liga',
			sourceUrl: undefined,
		},
	]);
	assert.deepEqual(openedFiles, [{ name: 'Real Madrid vs Barcelona 2026-07-01.md' }]);
	assert.deepEqual(notices, ['Created match note: Real Madrid vs Barcelona 2026-07-01.md']);
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

void test('createManualMatchNoteWorkflow reports file creation failures', async () => {
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
			createMatchNoteFile: async () => {
				throw new Error('disk full');
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
		['error', 'Failed to create manual match note.', 'disk full'],
		['notice', 'Could not create match note. See console for details.'],
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
		['error', 'Created match note, but could not open it.', 'cannot open file'],
		[
			'notice',
			'Created match note: Real Madrid vs Barcelona 2026-07-01.md, but could not open it automatically.',
		],
	]);
});
