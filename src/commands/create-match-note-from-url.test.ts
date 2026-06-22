import assert from 'node:assert/strict';
import test from 'node:test';

import type FootballNotesPlugin from '../main';
import {
	CREATE_MATCH_NOTE_FROM_URL_COMMAND_ID,
	CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME,
	registerCreateMatchNoteFromUrlCommand,
} from './create-match-note-from-url';

interface RegisteredCommand {
	id: string;
	name: string;
	callback: () => Promise<void>;
}

void test('registerCreateMatchNoteFromUrlCommand wires the command entrypoint', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let createModalCalls = 0;
	let openCalls = 0;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as never,
		settings: {
			notesFolder: 'Football notes/matches',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateMatchNoteFromUrlCommand(plugin, {
		createModal: (_app: unknown, onSubmit) => {
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

void test('registerCreateMatchNoteFromUrlCommand submits the modal value through the workflow', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let capturedOnSubmit: ((value: string) => Promise<boolean>) | undefined;
	const createdPaths: string[] = [];
	const openedFiles: Array<{ name: string }> = [];
	const notices: string[] = [];

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: createTestApp(createdPaths, openedFiles),
		settings: {
			notesFolder: 'Scratch/matches',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateMatchNoteFromUrlCommand(plugin, {
		createModal: (_app: unknown, onSubmit) => {
			capturedOnSubmit = onSubmit;

			return {
				open() {
					// The modal still opens as part of the command flow.
				},
			};
		},
		showNotice: (message) => {
			notices.push(message);
		},
		logError: (message, error) => {
			throw new Error(`${message}: ${(error as Error).message}`);
		},
	});

	assert.ok(capturedCommand);

	await capturedCommand?.callback();

	assert.equal(typeof capturedOnSubmit, 'function');

	const result = await capturedOnSubmit?.(' https://example.com/match ');

	assert.equal(result, true);
	assert.equal(createdPaths.length, 3);
	assert.equal(createdPaths[0], 'Scratch');
	assert.equal(createdPaths[1], 'Scratch/matches');
	assert.match(
		createdPaths[2] ?? '',
		/^Scratch\/matches\/New match note \d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}\.md$/,
	);
	assert.equal(openedFiles.length, 1);
	assert.equal(openedFiles[0]?.name.startsWith('New match note '), true);
	assert.deepEqual(notices, [`Created match note: ${openedFiles[0]?.name}`]);
});

void test('registerCreateMatchNoteFromUrlCommand reports modal setup failures', async () => {
	const calls: Array<unknown> = [];
	let capturedCommand: RegisteredCommand | undefined;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as never,
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

function createTestApp(createdPaths: string[], openedFiles: Array<{ name: string }>) {
	const entries = new Map<string, { children?: unknown[]; name: string }>();

	return {
		vault: {
			getAbstractFileByPath(path: string) {
				return entries.get(path) ?? null;
			},
			async createFolder(path: string) {
				createdPaths.push(path);
				entries.set(path, {
					name: path.split('/').at(-1) ?? path,
					children: [],
				});
			},
			async create(path: string) {
				createdPaths.push(path);
				const file = {
					name: path.split('/').at(-1) ?? path,
				};
				entries.set(path, file);
				return file;
			},
		},
		workspace: {
			getLeaf() {
				return {
					async openFile(file: { name: string }) {
						openedFiles.push(file);
					},
				};
			},
		},
	};
}
