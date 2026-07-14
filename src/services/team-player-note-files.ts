import type { TAbstractFile, TFile, Vault } from 'obsidian';

import type { PlayerNoteInput, TeamNoteInput } from '../types';
import { createNoteFileFromDraft } from './note-files';
import { createNamedNotePath } from './note-paths';
import { createPlayerNoteDraft, createTeamNoteDraft } from './team-player-note-template';
import type { NamedNoteCreationResult } from './team-player-note-workflow';

export async function createTeamNoteFile(
	vault: Vault,
	input: TeamNoteInput,
): Promise<NamedNoteCreationResult<TFile>> {
	const draft = createTeamNoteDraft(input);
	const existingFile = await getExistingTeamNoteFile(vault, draft.folder, draft.title);

	if (existingFile !== null) {
		return {
			file: existingFile,
			existedAlready: true,
		};
	}

	const createdFile = await createNoteFileFromDraft(vault, draft, {
		noteLabel: 'team note',
	});

	return {
		file: createdFile,
		existedAlready: false,
	};
}

export async function createPlayerNoteFile(
	vault: Vault,
	input: PlayerNoteInput,
): Promise<NamedNoteCreationResult<TFile>> {
	const draft = createPlayerNoteDraft(input);
	const existingFile = await getExistingPlayerNoteFile(vault, draft.folder, draft.title);

	if (existingFile !== null) {
		return {
			file: existingFile,
			existedAlready: true,
		};
	}

	const createdFile = await createNoteFileFromDraft(vault, draft, {
		noteLabel: 'player note',
	});

	return {
		file: createdFile,
		existedAlready: false,
	};
}

async function getExistingPlayerNoteFile(
	vault: Vault,
	folder: string,
	title: string,
): Promise<TFile | null> {
	const exactPath = createNamedNotePath(folder, title);
	const existingFile = vault.getAbstractFileByPath(exactPath);

	if (!isTFileLike(existingFile)) {
		return null;
	}

	if (!(await isPlayerNoteFile(vault, existingFile))) {
		throw new Error(
			`Cannot create player note because "${exactPath}" already exists as a non-player file.`,
		);
	}

	return existingFile;
}

async function getExistingTeamNoteFile(
	vault: Vault,
	folder: string,
	title: string,
): Promise<TFile | null> {
	const exactPath = createNamedNotePath(folder, title);
	const existingFile = vault.getAbstractFileByPath(exactPath);

	if (!isTFileLike(existingFile)) {
		return null;
	}

	if (!(await isTeamNoteFile(vault, existingFile))) {
		throw new Error(
			`Cannot create team note because "${exactPath}" already exists as a non-team file.`,
		);
	}

	return existingFile;
}

async function isTeamNoteFile(vault: Vault, file: TFile): Promise<boolean> {
	const content = await vault.read(file);
	const frontmatter = extractFrontmatterLines(content);

	if (frontmatter === null) {
		return false;
	}

	const type = getFrontmatterValue(frontmatter, 'type');
	const sport = getFrontmatterValue(frontmatter, 'sport');
	const teamName = getFrontmatterValue(frontmatter, 'team_name');

	return type === 'team-note' && sport === 'football' && teamName.length > 0;
}

async function isPlayerNoteFile(vault: Vault, file: TFile): Promise<boolean> {
	const content = await vault.read(file);
	const frontmatter = extractFrontmatterLines(content);

	if (frontmatter === null) {
		return false;
	}

	const type = getFrontmatterValue(frontmatter, 'type');
	const sport = getFrontmatterValue(frontmatter, 'sport');
	const playerName = getFrontmatterValue(frontmatter, 'player_name');

	return type === 'player-note' && sport === 'football' && playerName.length > 0;
}

function extractFrontmatterLines(content: string): string[] | null {
	const normalizedContent = content.replace(/\r\n/g, '\n');

	if (!normalizedContent.startsWith('---\n')) {
		return null;
	}

	const frontmatterEndIndex = normalizedContent.indexOf('\n---', 4);

	if (frontmatterEndIndex === -1) {
		return null;
	}

	const closingMarkerEndIndex = frontmatterEndIndex + '\n---'.length;

	if (
		closingMarkerEndIndex < normalizedContent.length &&
		normalizedContent[closingMarkerEndIndex] !== '\n'
	) {
		return null;
	}

	return normalizedContent
		.slice(4, frontmatterEndIndex)
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

function getFrontmatterValue(frontmatter: string[], key: string): string {
	const entry = frontmatter.find((line) => line.startsWith(`${key}:`));

	if (entry === undefined) {
		return '';
	}

	const rawValue = entry.slice(key.length + 1).trim();

	if (
		(rawValue.startsWith('"') && rawValue.endsWith('"')) ||
		(rawValue.startsWith("'") && rawValue.endsWith("'"))
	) {
		return rawValue.slice(1, -1);
	}

	return rawValue;
}

function isTFileLike(value: TAbstractFile | null): value is TFile {
	return value !== null && !('children' in value);
}
