import assert from 'node:assert/strict';
import test from 'node:test';

import type FootballNotesPlugin from '../main';
import type { NamedNoteModalConfig, NamedNoteSubmitHandler } from '../ui/named-note-modal';
import {
	CREATE_TEAM_NOTE_COMMAND_ID,
	CREATE_TEAM_NOTE_COMMAND_NAME,
	registerCreateTeamNoteCommand,
} from './create-team-note';

interface RegisteredCommand {
	id: string;
	name: string;
	callback: () => Promise<void>;
}

const teamModalConfig: NamedNoteModalConfig = {
	title: 'Create team note',
	description: 'Enter a team name to create a new team note.',
	fieldLabel: 'Team name',
	placeholder: 'Real Madrid',
	submitLabel: 'Create note',
};

void test('registerCreateTeamNoteCommand wires the team command configuration', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let receivedConfig: NamedNoteModalConfig | undefined;
	let createModalCalls = 0;
	let openCalls = 0;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as never,
		settings: {
			teamNotesFolder: 'Football notes/teams',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateTeamNoteCommand(plugin, {
		createModal: (_app: unknown, config, onSubmit) => {
			createModalCalls += 1;
			receivedConfig = config;
			assert.equal(typeof onSubmit, 'function');

			return {
				open() {
					openCalls += 1;
				},
			};
		},
	});

	assert.ok(capturedCommand);
	assert.equal(capturedCommand?.id, CREATE_TEAM_NOTE_COMMAND_ID);
	assert.equal(capturedCommand?.name, CREATE_TEAM_NOTE_COMMAND_NAME);

	await capturedCommand?.callback();

	assert.equal(createModalCalls, 1);
	assert.equal(openCalls, 1);
	assert.deepEqual(receivedConfig, teamModalConfig);
});

void test('registerCreateTeamNoteCommand submits the modal value through the workflow', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let capturedOnSubmit: NamedNoteSubmitHandler | undefined;
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
			teamNotesFolder: 'Scratch/teams',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateTeamNoteCommand(plugin, {
		createModal: (_app: unknown, _config, onSubmit) => {
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

	const result = await capturedOnSubmit?.(' Real Madrid ');

	assert.equal(result, true);
	assert.deepEqual(createdPaths, ['Scratch', 'Scratch/teams', 'Scratch/teams/Real Madrid.md']);
	assert.deepEqual(openedFiles, [{ name: 'Real Madrid.md' }]);
	assert.deepEqual(notices, ['Created team note: Real Madrid.md']);
});

void test('registerCreateTeamNoteCommand reports modal setup failures', async () => {
	const calls: Array<unknown> = [];
	let capturedCommand: RegisteredCommand | undefined;

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: {} as never,
		settings: {
			teamNotesFolder: 'Football notes/teams',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateTeamNoteCommand(plugin, {
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
