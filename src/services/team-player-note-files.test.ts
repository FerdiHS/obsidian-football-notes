import assert from 'node:assert/strict';
import test from 'node:test';

import type { Vault } from 'obsidian';

import { createPlayerNoteFile, createTeamNoteFile } from './team-player-note-files';

void test('createTeamNoteFile returns the existing team note instead of duplicating it', async () => {
	const vault = new FakeVault();

	const firstFile = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	const secondFile = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(firstFile.file.path, 'Football notes/teams/Real Madrid.md');
	assert.equal(firstFile.existedAlready, false);
	assert.strictEqual(secondFile.file, firstFile.file);
	assert.equal(secondFile.file.path, 'Football notes/teams/Real Madrid.md');
	assert.equal(secondFile.existedAlready, true);
	assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/teams']);
	assert.deepEqual(vault.createCalls, [
		{
			path: 'Football notes/teams/Real Madrid.md',
			content: vault.createContents[0],
		},
	]);
	assert.match(vault.createContents[0] ?? '', /type: team-note/);
	assert.match(vault.createContents[0] ?? '', /team_name: "Real Madrid"/);
	assert.match(vault.createContents[0] ?? '', /# Team Name/);
});

void test('createTeamNoteFile reuses the legacy team note schema', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/teams/Real Madrid.md',
		[
			'---',
			'type: team',
			'sport: football',
			'team_name: "Real Madrid"',
			'---',
			'# Team Name',
		].join('\n'),
	);

	const result = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, 'Football notes/teams/Real Madrid.md');
	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile reuses a team note with single-quoted escaped YAML values', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		"Football notes/teams/Queen's Park.md",
		[
			'---',
			'type: team-note',
			'sport: football',
			"team_name: 'Queen''s Park'",
			'---',
			'# Team Name',
		].join('\n'),
	);

	const result = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: "Queen's Park",
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, "Football notes/teams/Queen's Park.md");
	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile reuses a team note with a block scalar frontmatter value', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/teams/Real Madrid.md',
		[
			'---',
			'type: team-note',
			'sport: football',
			'team_name: >-',
			'  Real Madrid',
			'---',
			'# Team Name',
		].join('\n'),
	);

	const result = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, 'Football notes/teams/Real Madrid.md');
	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile reuses notes with escaped quoted names on round trip', async () => {
	const vault = new FakeVault();
	const noteName = 'Javier "Chicharito" Hernández';

	const firstResult = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: noteName,
	});

	const secondResult = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: noteName,
	});

	assert.equal(firstResult.existedAlready, false);
	assert.equal(secondResult.existedAlready, true);
	assert.strictEqual(secondResult.file, firstResult.file);
	assert.equal(vault.createCalls.length, 1);
});

void test('createTeamNoteFile rejects a non-team file that blocks the target path', async () => {
	const vault = new FakeVault();
	vault.seedFile('Football notes/teams/Real Madrid.md', '# Not a team note');

	await assert.rejects(
		createTeamNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/teams ',
			name: ' Real Madrid ',
		}),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists as a non-team file\./,
	);
});

void test('createTeamNoteFile reuses a team note whose frontmatter ends at EOF', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/teams/Real Madrid.md',
		[
			'---',
			'type: team-note',
			'sport: football',
			'team_name: "Real Madrid"',
			'---',
			'# Team Name',
		].join('\n'),
	);

	const result = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, 'Football notes/teams/Real Madrid.md');
	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile rejects a folder that blocks the exact note path', async () => {
	const vault = new FakeVault();
	vault.seedFolder('Football notes/teams/Real Madrid.md');

	await assert.rejects(
		createTeamNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/teams ',
			name: ' Real Madrid ',
		}),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists as a folder\./,
	);
});

void test('createTeamNoteFile rejects nested frontmatter metadata instead of reusing it', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/teams/Real Madrid.md',
		[
			'---',
			'metadata:',
			'  type: team-note',
			'  sport: football',
			'  team_name: "Real Madrid"',
			'---',
			'# Team Name',
		].join('\n'),
	);

	await assert.rejects(
		createTeamNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/teams ',
			name: ' Real Madrid ',
		}),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile rejects a different team that appears during exact-path creation', async () => {
	const vault = new FakeVault();
	vault.simulateAlreadyExistsOnCreate(
		'Football notes/teams/Real Madrid.md',
		[
			'---',
			'type: team-note',
			'sport: football',
			'team_name: "Barcelona"',
			'---',
			'# Team Name',
		].join('\n'),
	);

	await assert.rejects(
		createTeamNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/teams ',
			name: ' Real Madrid ',
		}),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists for a different team note\./,
	);

	assert.equal(vault.createCalls.length, 1);
});

void test('createTeamNoteFile rejects an exact-name collision with a different team', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/teams/Foo-Bar.md',
		[
			'---',
			'type: team-note',
			'sport: football',
			'team_name: "Foo/Bar"',
			'---',
			'# Team Name',
		].join('\n'),
	);

	await assert.rejects(
		createTeamNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/teams ',
			name: ' Foo:Bar ',
		}),
		/Cannot create team note because "Football notes\/teams\/Foo-Bar\.md" already exists for a different team note\./,
	);

	assert.deepEqual(vault.createCalls, []);
});

void test('createTeamNoteFile reuses a team note that appears during exact-path creation without creating a numbered duplicate', async () => {
	const vault = new FakeVault();
	vault.simulateAlreadyExistsOnCreate('Football notes/teams/Real Madrid.md');

	const result = await createTeamNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/teams ',
		name: ' Real Madrid ',
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, 'Football notes/teams/Real Madrid.md');
	assert.deepEqual(vault.createCalls, [
		{
			path: 'Football notes/teams/Real Madrid.md',
			content: vault.createContents[0],
		},
	]);
	assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/teams']);
});

void test('createPlayerNoteFile creates structured player notes', async () => {
	const vault = new FakeVault();

	const file = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	assert.equal(file.file.path, 'Football notes/players/Lamine Yamal.md');
	assert.equal(file.existedAlready, false);
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

void test('createPlayerNoteFile reuses the legacy player note schema', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/players/Lamine Yamal.md',
		[
			'---',
			'type: player',
			'sport: football',
			'player_name: "Lamine Yamal"',
			'---',
			'# Player Name',
		].join('\n'),
	);

	const result = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	assert.equal(result.existedAlready, true);
	assert.equal(result.file.path, 'Football notes/players/Lamine Yamal.md');
	assert.deepEqual(vault.createCalls, []);
});

void test('createPlayerNoteFile reuses notes with escaped quoted names on round trip', async () => {
	const vault = new FakeVault();
	const noteName = 'Javier "Chicharito" Hernández';

	const firstResult = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: noteName,
	});

	const secondResult = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: noteName,
	});

	assert.equal(firstResult.existedAlready, false);
	assert.equal(secondResult.existedAlready, true);
	assert.strictEqual(secondResult.file, firstResult.file);
	assert.equal(vault.createCalls.length, 1);
});

void test('createPlayerNoteFile rejects a folder that blocks the exact note path', async () => {
	const vault = new FakeVault();
	vault.seedFolder('Football notes/players/Lamine Yamal.md');

	await assert.rejects(
		createPlayerNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/players ',
			name: ' Lamine Yamal ',
		}),
		/Cannot create player note because "Football notes\/players\/Lamine Yamal\.md" already exists as a folder\./,
	);
});

void test('createPlayerNoteFile returns the existing player note instead of duplicating it', async () => {
	const vault = new FakeVault();

	const firstFile = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	const secondFile = await createPlayerNoteFile(vault as unknown as Vault, {
		destinationFolder: ' Football notes/players ',
		name: ' Lamine Yamal ',
	});

	assert.equal(firstFile.file.path, 'Football notes/players/Lamine Yamal.md');
	assert.equal(firstFile.existedAlready, false);
	assert.strictEqual(secondFile.file, firstFile.file);
	assert.equal(secondFile.file.path, 'Football notes/players/Lamine Yamal.md');
	assert.equal(secondFile.existedAlready, true);
	assert.deepEqual(vault.createFolderCalls, ['Football notes', 'Football notes/players']);
	assert.deepEqual(vault.createCalls, [
		{
			path: 'Football notes/players/Lamine Yamal.md',
			content: vault.createContents[0],
		},
	]);
});

void test('createPlayerNoteFile rejects a non-player file that blocks the target path', async () => {
	const vault = new FakeVault();
	vault.seedFile('Football notes/players/Lamine Yamal.md', '# Not a player note');

	await assert.rejects(
		createPlayerNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/players ',
			name: ' Lamine Yamal ',
		}),
		/Cannot create player note because "Football notes\/players\/Lamine Yamal\.md" already exists as a non-player file\./,
	);
});

void test('createPlayerNoteFile rejects an exact-name collision with a different player', async () => {
	const vault = new FakeVault();
	vault.seedFile(
		'Football notes/players/Foo-Bar.md',
		[
			'---',
			'type: player-note',
			'sport: football',
			'player_name: "Foo/Bar"',
			'---',
			'# Player Name',
		].join('\n'),
	);

	await assert.rejects(
		createPlayerNoteFile(vault as unknown as Vault, {
			destinationFolder: ' Football notes/players ',
			name: ' Foo:Bar ',
		}),
		/Cannot create player note because "Football notes\/players\/Foo-Bar\.md" already exists for a different player note\./,
	);

	assert.deepEqual(vault.createCalls, []);
});

class FakeVault {
	private files = new Map<string, FakeVaultEntry>();
	private fileContents = new Map<string, string>();
	private createFailureOnce = new Map<string, string | undefined>();

	createCalls: Array<{ path: string; content: string }> = [];

	createFolderCalls: string[] = [];

	createContents: string[] = [];

	simulateAlreadyExistsOnCreate(path: string, existingContent?: string): void {
		this.createFailureOnce.set(path, existingContent);
	}

	seedFile(path: string, content = ''): void {
		this.files.set(path, createFakeFile(path));
		this.fileContents.set(path, content);
	}

	seedFolder(path: string): void {
		this.files.set(path, createFakeFolder(path));
	}

	getAbstractFileByPath(path: string): FakeVaultEntry | null {
		return this.files.get(path) ?? null;
	}

	async create(path: string, content: string): Promise<FakeVaultEntry> {
		this.createCalls.push({ path, content });
		this.createContents.push(content);

		if (this.createFailureOnce.has(path)) {
			const existingContent = this.createFailureOnce.get(path);
			this.createFailureOnce.delete(path);
			this.fileContents.set(path, existingContent ?? content);
			this.files.set(path, createFakeFile(path));
			throw new Error(`File already exists: ${path}`);
		}

		if (this.files.has(path)) {
			throw new Error(`File already exists: ${path}`);
		}

		this.fileContents.set(path, content);

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

	async read(file: FakeFile): Promise<string> {
		return this.fileContents.get(file.path) ?? '';
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
