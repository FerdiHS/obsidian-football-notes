import assert from 'node:assert/strict';
import test from 'node:test';

import { createNamedNoteWorkflow } from './team-player-note-workflow';

void test('createNamedNoteWorkflow creates and opens a team note', async () => {
	await assertNamedNoteWorkflow('team', 'Team Note');
});

void test('createNamedNoteWorkflow creates and opens a player note', async () => {
	await assertNamedNoteWorkflow('player', 'Player Note');
});

void test('createNamedNoteWorkflow opens existing team notes without claiming they were created', async () => {
	const calls: Array<unknown> = [];

	const result = await createNamedNoteWorkflow('Team Note', {
		destinationFolder: 'Football notes/teams',
		noteKind: 'team',
		createNoteFile: async () => ({
			file: {
				name: 'Team Note.md',
			},
			existedAlready: true,
		}),
		openNote: async () => {
			// The workflow should still open the existing note.
		},
		showNotice: (message) => {
			calls.push(['notice', message]);
		},
		logError: (message, error) => {
			calls.push(['error', message, (error as Error).message]);
		},
	});

	assert.equal(result, true);
	assert.deepEqual(calls, [['notice', 'Opened existing team note: Team Note.md']]);
});

void test('createNamedNoteWorkflow rejects empty team names', async () => {
	const notices: string[] = [];

	const result = await createNamedNoteWorkflow('   ', {
		destinationFolder: 'Football notes/teams',
		noteKind: 'team',
		createNoteFile: async () => {
			throw new Error('should not be called');
		},
		openNote: async () => {
			throw new Error('should not be called');
		},
		showNotice: (message) => notices.push(message),
		logError: () => {
			throw new Error('should not be called');
		},
	});

	assert.equal(result, false);
	assert.deepEqual(notices, ['Team name cannot be empty.']);
});

void test('createNamedNoteWorkflow rejects team names that collapse to an empty filename', async () => {
	const notices: string[] = [];

	const result = await createNamedNoteWorkflow('...', {
		destinationFolder: 'Football notes/teams',
		noteKind: 'team',
		createNoteFile: async () => {
			throw new Error('should not be called');
		},
		openNote: async () => {
			throw new Error('should not be called');
		},
		showNotice: (message) => notices.push(message),
		logError: () => {
			throw new Error('should not be called');
		},
	});

	assert.equal(result, false);
	assert.deepEqual(notices, ['Team name cannot be empty.']);
});

void test('createNamedNoteWorkflow reports create failures for player notes', async () => {
	const calls: Array<unknown> = [];

	const result = await createNamedNoteWorkflow('Player Note', {
		destinationFolder: 'Football notes/players',
		noteKind: 'player',
		createNoteFile: async () => {
			throw new Error('vault unavailable');
		},
		openNote: async () => {
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
		['error', 'Failed to create player note.', 'vault unavailable'],
		['notice', 'Could not create player note. See console for details.'],
	]);
});

void test('createNamedNoteWorkflow reports open failures for team notes', async () => {
	const calls: Array<unknown> = [];

	const result = await createNamedNoteWorkflow('Team Note', {
		destinationFolder: 'Football notes/teams',
		noteKind: 'team',
		createNoteFile: async () => ({
			file: {
				name: 'Team Note.md',
			},
			existedAlready: false,
		}),
		openNote: async () => {
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
		['error', 'Created team note, but could not open it.', 'workspace unavailable'],
		['notice', 'Created team note: Team Note.md, but could not open it automatically.'],
	]);
});

async function assertNamedNoteWorkflow(
	noteKind: 'team' | 'player',
	noteName: string,
): Promise<void> {
	const createdInputs: Array<{ destinationFolder: string; name: string }> = [];
	const openedFiles: Array<{ name: string }> = [];
	const notices: string[] = [];

	const result = await createNamedNoteWorkflow(` ${noteName} `, {
		destinationFolder: `Football notes/${noteKind}s`,
		noteKind,
		createNoteFile: async (input) => {
			createdInputs.push(input);
			return {
				file: {
					name: `${input.name}.md`,
				},
				existedAlready: false,
			};
		},
		openNote: async (file) => {
			openedFiles.push(file);
		},
		showNotice: (message) => {
			notices.push(message);
		},
		logError: (message, error) => {
			throw new Error(`${message}: ${(error as Error).message}`);
		},
	});

	assert.equal(result, true);
	assert.deepEqual(createdInputs, [
		{
			destinationFolder: `Football notes/${noteKind}s`,
			name: noteName,
		},
	]);
	assert.deepEqual(openedFiles, [
		{
			name: `${noteName}.md`,
		},
	]);
	assert.deepEqual(notices, [`Created ${noteKind} note: ${noteName}.md`]);
}
