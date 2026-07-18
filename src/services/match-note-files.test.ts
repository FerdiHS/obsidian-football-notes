import assert from 'node:assert/strict';
import test from 'node:test';

import type { Vault } from 'obsidian';

import { createManualMatchNoteFile, createMatchNoteFile } from './match-note-files';
import { createMatchNotePath } from './match-note-paths';
import { UserFacingCreateError } from './user-facing-error';
import type { ManualMatchNoteInput, MatchNoteInput } from '../types';

void test('createMatchNoteFile retries until it finds a free path', async () => {
	const fixedDate = new Date('2026-06-20T12:34:56Z');
	const originalDate = globalThis.Date;
	const vault = new FakeVault();
	const folder = 'Football notes/matches';
	const firstCandidate = createMatchNotePath(folder, 'New match note', fixedDate, 1);
	const secondCandidate = createMatchNotePath(folder, 'New match note', fixedDate, 2);

	vault.seedFile(firstCandidate);
	vault.seedFile(secondCandidate);

	await withFixedDate(fixedDate, async () => {
		const result = await createMatchNoteFile(vault as unknown as Vault, createInput(folder));

		assert.equal(result.path, createMatchNotePath(folder, 'New match note', fixedDate, 3));
		assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/matches']);
		assert.deepEqual(vault.createCalls, [
			{
				path: createMatchNotePath(folder, 'New match note', fixedDate, 3),
				content: vault.createdContent,
			},
		]);
	});

	assert.equal(globalThis.Date, originalDate);
});

void test('createMatchNoteFile retries when create races with an already existing file', async () => {
	const fixedDate = new Date('2026-06-20T12:34:56Z');
	const vault = new FakeVault();
	const folder = 'Football notes/matches';
	const firstCandidate = createMatchNotePath(folder, 'New match note', fixedDate, 1);
	const secondCandidate = createMatchNotePath(folder, 'New match note', fixedDate, 2);

	vault.failCreateOnce(firstCandidate);

	await withFixedDate(fixedDate, async () => {
		const result = await createMatchNoteFile(vault as unknown as Vault, createInput(folder));

		assert.equal(result.path, secondCandidate);
		assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/matches']);
		assert.deepEqual(vault.createCalls, [
			{
				path: firstCandidate,
				content: vault.createdContent,
			},
			{
				path: secondCandidate,
				content: vault.createdContent,
			},
		]);
	});
});

void test('createMatchNoteFile stops after 100 failed attempts', async () => {
	const fixedDate = new Date('2026-06-20T12:34:56Z');
	const vault = new FakeVault();
	const folder = 'Football notes/matches';
	const expectedPaths = Array.from({ length: 100 }, (_, index) =>
		createMatchNotePath(folder, 'New match note', fixedDate, index + 1),
	);

	for (const path of expectedPaths) {
		vault.seedFile(path);
	}

	await withFixedDate(fixedDate, async () => {
		await assert.rejects(
			createMatchNoteFile(vault as unknown as Vault, createInput(folder)),
			(error: unknown) => {
				assert.ok(error instanceof UserFacingCreateError);
				assert.equal(
					error.message,
					'Could not create match note "New match note" in "Football notes/matches" after 100 attempts.',
				);
				return true;
			},
		);
	});
});

void test('createMatchNoteFile rejects a destination folder occupied by a file', async () => {
	const fixedDate = new Date('2026-06-20T12:34:56Z');
	const vault = new FakeVault();
	const folder = 'Football notes/matches';

	vault.seedFile(folder);

	await withFixedDate(fixedDate, async () => {
		await assert.rejects(
			createMatchNoteFile(vault as unknown as Vault, createInput(folder)),
			(error: unknown) => {
				assert.ok(error instanceof UserFacingCreateError);
				assert.equal(
					error.message,
					'Cannot create match note folder because "Football notes/matches" already exists as a file.',
				);
				return true;
			},
		);
	});
});

void test('createManualMatchNoteFile sanitizes the note title in the file path', async () => {
	const fixedDate = new Date('2026-06-20T12:34:56Z');
	const vault = new FakeVault();
	const input: ManualMatchNoteInput = {
		destinationFolder: 'Scratch/matches',
		homeTeam: 'Foo/Bar',
		awayTeam: 'Baz',
		homeTeamNotePath: 'Football notes/teams/Foo-Bar',
		awayTeamNotePath: 'Football notes/teams/Baz',
		matchDate: '2026-06-20',
		competition: 'Friendly',
	};

	await withFixedDate(fixedDate, async () => {
		const result = await createManualMatchNoteFile(vault as unknown as Vault, input);

		assert.equal(
			result.path,
			createMatchNotePath('Scratch/matches', 'Foo/Bar vs Baz 2026-06-20', fixedDate, 1),
		);
		assert.deepEqual(vault.createFolderCalls, ['Scratch', 'Scratch/matches']);
		assert.match(vault.createdContent, /home_team_note: "Football notes\/teams\/Foo-Bar"/);
		assert.match(vault.createdContent, /away_team_note: "Football notes\/teams\/Baz"/);
		assert.match(vault.createdContent, /- Home team: \[\[Football notes\/teams\/Foo-Bar\]\]/);
		assert.match(vault.createdContent, /- Away team: \[\[Football notes\/teams\/Baz\]\]/);
	});
});

function createInput(destinationFolder: string): MatchNoteInput {
	return {
		source: {
			sourceUrl: 'https://example.com/match',
			sourceHost: 'example.com',
		},
		destinationFolder,
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
	private createFailures = new Set<string>();

	createCalls: Array<{ path: string; content: string }> = [];

	createFolderCalls: string[] = [];

	createdContent = '';

	seedFile(path: string): void {
		this.files.set(path, createFakeFile(path));
	}

	failCreateOnce(path: string): void {
		this.createFailures.add(path);
	}

	getAbstractFileByPath(path: string): FakeVaultEntry | null {
		return this.files.get(path) ?? null;
	}

	async create(path: string, content: string): Promise<FakeVaultEntry> {
		this.createCalls.push({ path, content });
		this.createdContent = content;

		if (this.createFailures.has(path)) {
			this.createFailures.delete(path);
			throw new Error(`File already exists: ${path}`);
		}

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
