import assert from 'node:assert/strict';
import test from 'node:test';

import { createMatchNoteFromUrlWorkflow } from './match-note-workflow';

void test('createMatchNoteFromUrlWorkflow creates and opens a match note for a valid URL', async () => {
	const calls: Array<unknown> = [];
	const createdFile = createTestFile('New match note 2026-06-20 12-34-56.md');

	const result = await createMatchNoteFromUrlWorkflow(' HTTPS://EXAMPLE.COM/match ', {
		destinationFolder: 'Football notes/matches',
		createMatchNoteFile: async (input) => {
			calls.push(['create', input]);
			return createdFile;
		},
		openMatchNote: async (file) => {
			calls.push(['open', file]);
		},
		showNotice: (message) => {
			calls.push(['notice', message]);
		},
		logError: (message, error) => {
			calls.push(['error', message, (error as Error).message]);
		},
	});

	assert.equal(result, true);
	assert.deepEqual(calls[0], [
		'create',
		{
			source: {
				sourceUrl: 'https://example.com/match',
				sourceHost: 'example.com',
			},
			destinationFolder: 'Football notes/matches',
		},
	]);
	assert.deepEqual(calls[1], ['open', createdFile]);
	assert.deepEqual(calls[2], ['notice', `Created match note: ${createdFile.name}`]);
	assert.equal(calls.length, 3);
});

void test('createMatchNoteFromUrlWorkflow shows the parser error for invalid URLs', async () => {
	const calls: Array<unknown> = [];

	const result = await createMatchNoteFromUrlWorkflow('ftp://example.com/match', {
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
	});

	assert.equal(result, false);
	assert.deepEqual(calls, [['notice', 'Match URL must use http:// or https://.']]);
});

void test('createMatchNoteFromUrlWorkflow reports creation failures', async () => {
	const calls: Array<unknown> = [];

	const result = await createMatchNoteFromUrlWorkflow('https://example.com/match', {
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
	});

	assert.equal(result, false);
	assert.deepEqual(calls, [
		['error', 'Failed to create match note from URL.', 'disk full'],
		['notice', 'Could not create match note. See console for details.'],
	]);
});

void test('createMatchNoteFromUrlWorkflow reports open failures without hiding the created note', async () => {
	const calls: Array<unknown> = [];
	const createdFile = createTestFile('New match note 2026-06-20 12-34-56.md');

	const result = await createMatchNoteFromUrlWorkflow('https://example.com/match', {
		destinationFolder: 'Football notes/matches',
		createMatchNoteFile: async () => createdFile,
		openMatchNote: async () => {
			throw new Error('workspace unavailable');
		},
		showNotice: (message) => {
			calls.push(['notice', message]);
		},
		logError: (message, error) => {
			calls.push(['error', message, (error as Error).message]);
		},
	});

	assert.equal(result, true);
	assert.deepEqual(calls, [
		['error', 'Created match note, but could not open it.', 'workspace unavailable'],
		['notice', `Created match note: ${createdFile.name}, but could not open it automatically.`],
	]);
});

function createTestFile(name: string): { name: string } {
	return { name };
}
