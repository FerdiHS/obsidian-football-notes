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
