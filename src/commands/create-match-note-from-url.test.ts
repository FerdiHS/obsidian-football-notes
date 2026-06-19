import assert from 'node:assert/strict';
import test from 'node:test';

import { type App, type TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { parseMatchUrl } from '../services/match-url-parser';
import {
	CREATE_MATCH_NOTE_FROM_URL_COMMAND_ID,
	CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME,
	createMatchNoteFromUrl,
	registerCreateMatchNoteFromUrlCommand,
} from './create-match-note-from-url';

interface RegisteredCommand {
	id: string;
	name: string;
	callback: () => Promise<void>;
}

void test('createMatchNoteFromUrl creates and opens a match note for a valid URL', async () => {
	const calls: Array<unknown> = [];
	const createdFile = createTestFile('New match note 2026-06-20 12-34-56.md');

	const result = await createMatchNoteFromUrl(' HTTPS://EXAMPLE.COM/match ', {
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

void test('createMatchNoteFromUrl shows the parser error for invalid URLs', async () => {
	const calls: Array<unknown> = [];

	const result = await createMatchNoteFromUrl('ftp://example.com/match', {
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

void test('createMatchNoteFromUrl reports creation failures', async () => {
	const calls: Array<unknown> = [];

	const result = await createMatchNoteFromUrl('https://example.com/match', {
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

void test('createMatchNoteFromUrl reports open failures without hiding the created note', async () => {
	const calls: Array<unknown> = [];
	const createdFile = createTestFile('New match note 2026-06-20 12-34-56.md');

	const result = await createMatchNoteFromUrl('https://example.com/match', {
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

void test('registerCreateMatchNoteFromUrlCommand wires the command entrypoint', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let createModalCalls = 0;
	let openCalls = 0;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as App,
		settings: {
			notesFolder: 'Football notes/matches',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateMatchNoteFromUrlCommand(plugin, {
		createModal: (_app, onSubmit) => {
			createModalCalls += 1;
			assert.equal(typeof onSubmit, 'function');

			return {
				open() {
					openCalls += 1;
				},
			};
		},
	});

	assert.ok(capturedCommand);
	assert.equal(capturedCommand?.id, CREATE_MATCH_NOTE_FROM_URL_COMMAND_ID);
	assert.equal(capturedCommand?.name, CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME);

	await capturedCommand?.callback();

	assert.equal(createModalCalls, 1);
	assert.equal(openCalls, 1);
});

void test('registerCreateMatchNoteFromUrlCommand reports modal setup failures', async () => {
	const calls: Array<unknown> = [];
	let capturedCommand: RegisteredCommand | undefined;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as App,
		settings: {
			notesFolder: 'Football notes/matches',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateMatchNoteFromUrlCommand(plugin, {
		createModal: async () => {
			throw new Error('modal unavailable');
		},
		showNotice: (message) => {
			calls.push(['notice', message]);
		},
		logError: (message, error) => {
			calls.push(['error', message, (error as Error).message]);
		},
	});

	await capturedCommand?.callback();

	assert.deepEqual(calls, [
		['error', 'Failed to open match note dialog.', 'modal unavailable'],
		['notice', 'Could not open match note dialog. See console for details.'],
	]);
});

void test('parseMatchUrl keeps the workflow parser behavior intact', () => {
	assert.equal(parseMatchUrl('https://example.com/match').ok, true);
});

function createTestFile(name: string): TFile {
	return {
		vault: undefined as never,
		path: `Football notes/matches/${name}`,
		name,
		parent: null,
		stat: undefined as never,
		basename: name.replace(/\.md$/u, ''),
		extension: 'md',
	};
}
