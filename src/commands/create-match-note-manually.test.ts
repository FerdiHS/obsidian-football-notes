import assert from 'node:assert/strict';
import test from 'node:test';

import type FootballNotesPlugin from '../main';
import { createMatchNotePath } from '../services/match-note-paths';
import {
	CREATE_MATCH_NOTE_MANUALLY_COMMAND_ID,
	CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME,
	registerCreateMatchNoteManuallyCommand,
} from './create-match-note-manually';
import type { ManualMatchNoteSubmission } from '../types';

interface RegisteredCommand {
	id: string;
	name: string;
	callback: () => Promise<void>;
}

void test('registerCreateMatchNoteManuallyCommand wires the command entrypoint', async () => {
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

	registerCreateMatchNoteManuallyCommand(plugin, {
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
	assert.equal(capturedCommand?.id, CREATE_MATCH_NOTE_MANUALLY_COMMAND_ID);
	assert.equal(capturedCommand?.name, CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME);

	await capturedCommand?.callback();

	assert.equal(createModalCalls, 1);
	assert.equal(openCalls, 1);
});

void test('registerCreateMatchNoteManuallyCommand submits the modal values through the workflow', async () => {
	let capturedCommand: RegisteredCommand | undefined;
	let capturedOnSubmit: ((value: ManualMatchNoteSubmission) => Promise<boolean>) | undefined;
	const vault = new FakeVault();
	const openedFiles: Array<{ name: string }> = [];
	const notices: string[] = [];
	const fixedDate = new Date('2026-06-20T12:34:56Z');

	const plugin = {
		addCommand(command: RegisteredCommand) {
			capturedCommand = command;
			return command;
		},
		app: createTestApp(vault, openedFiles),
		settings: {
			notesFolder: 'Scratch/matches',
		},
	} as unknown as FootballNotesPlugin;

	registerCreateMatchNoteManuallyCommand(plugin, {
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

	await withFixedDate(fixedDate, async () => {
		const result = await capturedOnSubmit?.({
			homeTeam: 'Foo/Bar',
			awayTeam: 'Baz',
			matchDate: '2026-07-01',
			competition: 'Friendly',
		});

		const expectedPath = createMatchNotePath(
			'Scratch/matches',
			'Foo/Bar vs Baz 2026-07-01',
			fixedDate,
			1,
		);

		assert.equal(result, true);
		assert.deepEqual(vault.createFolderCalls, ['Scratch', 'Scratch/matches']);
		assert.equal(vault.createCalls.length, 1);
		assert.equal(vault.createCalls[0]?.path, expectedPath);
		assert.match(vault.createCalls[0]?.content ?? '', /- Home team: \[\[Foo\/Bar\]\]/);
		assert.match(vault.createCalls[0]?.content ?? '', /- Away team: \[\[Baz\]\]/);
		assert.equal(vault.createCalls[0]?.content.includes('Source URL:'), false);
		assert.deepEqual(openedFiles, [
			{
				path: expectedPath,
				name: expectedPath.slice(expectedPath.lastIndexOf('/') + 1),
			},
		]);
		assert.deepEqual(notices, [
			`Created match note: ${expectedPath.slice(expectedPath.lastIndexOf('/') + 1)}`,
		]);
	});
});

void test('registerCreateMatchNoteManuallyCommand reports modal setup failures', async () => {
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

	registerCreateMatchNoteManuallyCommand(plugin, {
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
		['error', 'Failed to open manual match note dialog.', 'modal unavailable'],
		['notice', 'Could not open manual match note dialog. See console for details.'],
	]);
});

function createTestApp(vault: FakeVault, openedFiles: Array<{ name: string }>) {
	return {
		vault,
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

async function withFixedDate<T>(fixedDate: Date, callback: () => Promise<T>): Promise<T> {
	const originalDate = globalThis.Date;

	class MockDate extends originalDate {
		constructor(...args: [] | [string | number | Date]) {
			if (args.length === 0) {
				super(fixedDate.getTime());
				return;
			}

			super(...args);
		}

		static now(): number {
			return fixedDate.getTime();
		}
	}

	globalThis.Date = MockDate as unknown as DateConstructor;

	try {
		return await callback();
	} finally {
		globalThis.Date = originalDate;
	}
}

class FakeVault {
	private files = new Map<string, FakeVaultEntry>();

	createCalls: Array<{ path: string; content: string }> = [];

	createFolderCalls: string[] = [];

	getAbstractFileByPath(path: string): FakeVaultEntry | null {
		return this.files.get(path) ?? null;
	}

	async create(path: string, content: string): Promise<FakeVaultEntry> {
		this.createCalls.push({ path, content });

		if (this.files.has(path)) {
			throw new Error(`File already exists: ${path}`);
		}

		const file = createFakeFile(path);
		this.files.set(path, file);
		return file;
	}

	async createFolder(path: string): Promise<void> {
		this.createFolderCalls.push(path);

		if (this.files.has(path)) {
			throw new Error(`File already exists: ${path}`);
		}

		this.files.set(path, createFakeFolder(path));
	}
}

type FakeVaultEntry = FakeFile | FakeFolder;

interface FakeFile {
	path: string;
	name: string;
}

interface FakeFolder {
	path: string;
	name: string;
	children: Array<unknown>;
}

function createFakeFile(path: string): FakeFile {
	return {
		path,
		name: path.slice(path.lastIndexOf('/') + 1),
	};
}

function createFakeFolder(path: string): FakeFolder {
	return {
		path,
		name: path.slice(path.lastIndexOf('/') + 1),
		children: [],
	};
}
