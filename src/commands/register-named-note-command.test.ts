import assert from 'node:assert/strict';
import test from 'node:test';

import type FootballNotesPlugin from '../main';
import type { NamedNoteModalConfig, NamedNoteSubmitHandler } from '../ui/named-note-modal';
import {
	registerNamedNoteCommand,
	type NamedNoteCommandDefinition,
	type NamedNoteModalLike,
} from './register-named-note-command';

interface RegisteredCommand {
	id: string;
	name: string;
	callback: () => Promise<void>;
}

const modalConfig: NamedNoteModalConfig = {
	title: 'Create team note',
	description: 'Enter a team name to create a new team note.',
	fieldLabel: 'Team name',
	placeholder: 'Real Madrid',
	submitLabel: 'Create note',
};

void test('registerNamedNoteCommand wires successful named-note creation', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let capturedOnSubmit: NamedNoteSubmitHandler | undefined;
	let createModalCalls = 0;
	let openCalls = 0;
	const createInputs: Array<{ destinationFolder: string; name: string }> = [];
	const openedFiles: Array<{ name: string }> = [];
	const notices: string[] = [];

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {},
	} as unknown as FootballNotesPlugin;

	const definition: NamedNoteCommandDefinition<{ name: string }> = {
		id: 'create-team-note',
		name: 'Create team note',
		noteKind: 'team',
		getDestinationFolder: () => 'Scratch/teams',
		modalConfig,
		createNoteFile: async (_plugin, input) => {
			createInputs.push(input);
			return {
				file: { name: `${input.name}.md` },
				existedAlready: false,
			};
		},
		openNote: async (_plugin, file) => {
			openedFiles.push(file);
		},
	};

	registerNamedNoteCommand(plugin, definition, {
		createModal: (_app, _config, onSubmit) => {
			createModalCalls += 1;
			capturedOnSubmit = onSubmit;
			return {
				open() {
					openCalls += 1;
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
	assert.equal(capturedCommand?.id, 'create-team-note');
	assert.equal(capturedCommand?.name, 'Create team note');
	assert.equal(createModalCalls, 0);

	await capturedCommand?.callback();

	assert.equal(createModalCalls, 1);
	assert.equal(openCalls, 1);
	assert.equal(typeof capturedOnSubmit, 'function');

	const result = await capturedOnSubmit?.(' Real Madrid ');

	assert.equal(result, true);
	assert.deepEqual(createInputs, [
		{
			destinationFolder: 'Scratch/teams',
			name: 'Real Madrid',
		},
	]);
	assert.deepEqual(openedFiles, [{ name: 'Real Madrid.md' }]);
	assert.deepEqual(notices, ['Created team note: Real Madrid.md']);
});

void test('registerNamedNoteCommand forwards the modal config to the modal factory', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let receivedConfig: NamedNoteModalConfig | undefined;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {},
	} as unknown as FootballNotesPlugin;

	const definition: NamedNoteCommandDefinition = {
		id: 'create-player-note',
		name: 'Create player note',
		noteKind: 'player',
		getDestinationFolder: () => 'Scratch/players',
		modalConfig: {
			title: 'Create player note',
			description: 'Enter a player name to create a new player note.',
			fieldLabel: 'Player name',
			placeholder: 'Lamine Yamal',
			submitLabel: 'Create note',
		},
		createNoteFile: async () => ({
			file: { name: 'Lamine Yamal.md' },
			existedAlready: false,
		}),
		openNote: async () => {},
	};

	registerNamedNoteCommand(plugin, definition, {
		createModal: (_app, config) => {
			receivedConfig = config;
			return createOpenModal();
		},
	});

	assert.ok(capturedCommand);
	assert.equal(receivedConfig, undefined);

	await capturedCommand?.callback();

	assert.deepEqual(receivedConfig, definition.modalConfig);
});

void test('registerNamedNoteCommand reports modal setup failures', async () => {
	const calls: Array<unknown> = [];
	let capturedCommand: RegisteredCommand | undefined;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {},
	} as unknown as FootballNotesPlugin;

	const definition: NamedNoteCommandDefinition = {
		id: 'create-team-note',
		name: 'Create team note',
		noteKind: 'team',
		getDestinationFolder: () => 'Football notes/teams',
		modalConfig,
		createNoteFile: async () => ({
			file: { name: 'Real Madrid.md' },
			existedAlready: false,
		}),
		openNote: async () => {},
	};

	registerNamedNoteCommand(plugin, definition, {
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
		['error', 'Failed to open team note dialog.', 'modal unavailable'],
		['notice', 'Could not open team note dialog. See console for details.'],
	]);
});

function createOpenModal(): NamedNoteModalLike {
	return {
		open() {},
	};
}
