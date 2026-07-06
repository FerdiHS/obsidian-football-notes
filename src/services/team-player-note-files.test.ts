import assert from 'node:assert/strict';
import test from 'node:test';

import type { Vault } from 'obsidian';

import { createPlayerNoteFile, createTeamNoteFile } from './team-player-note-files';

void test('createTeamNoteFile creates structured team notes and avoids duplicates', async () => {
	const vault = new FakeVault();

	const firstFile = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	const secondFile = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(firstFile.path, 'Football notes/teams/Real Madrid.md');
	assert.equal(secondFile.path, 'Football notes/teams/Real Madrid 2.md');
	assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/teams']);
	assert.deepEqual(vault.createCalls, [
		{
			path: 'Football notes/teams/Real Madrid.md',
			content: vault.createContents[0],
		},
		{
			path: 'Football notes/teams/Real Madrid 2.md',
			content: vault.createContents[1],
		},
	]);
	assert.match(vault.createContents[0] ?? '', /type: team-note/);
	assert.match(vault.createContents[0] ?? '', /team_name: "Real Madrid"/);
	assert.match(vault.createContents[0] ?? '', /# Team Name/);
});

void test('createPlayerNoteFile creates structured player notes', async () => {
	const vault = new FakeVault();

	const file = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	assert.equal(file.path, 'Football notes/players/Lamine Yamal.md');
	assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/players']);
	assert.deepEqual(vault.createCalls, [
		{
			path: 'Football notes/players/Lamine Yamal.md',
			content: vault.createContents[0],
		},
	]);
	assert.match(vault.createContents[0] ?? '', /type: player-note/);
	assert.match(vault.createContents[0] ?? '', /player_name: "Lamine Yamal"/);
	assert.match(vault.createContents[0] ?? '', /# Player Name/);
});

class FakeVault {
	private files = new Map<string, FakeVaultEntry>();

	createCalls: Array<{ path: string; content: string }> = [];

	createFolderCalls: string[] = [];

	createContents: string[] = [];

	getAbstractFileByPath(path: string): FakeVaultEntry | null {
		return this.files.get(path) ?? null;
	}

	async create(path: string, content: string): Promise<FakeVaultEntry> {
		this.createCalls.push({ path, content });
		this.createContents.push(content);

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
