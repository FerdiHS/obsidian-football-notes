import type { TAbstractFile, TFile, Vault } from 'obsidian';

import type { PlayerNoteInput, TeamNoteInput } from '../types';
import { createExactNoteFileFromDraft } from './note-files';
import { createNamedNotePath } from './note-paths';
import { createPlayerNoteDraft, createTeamNoteDraft } from './team-player-note-template';
import type { NamedNoteCreationResult } from './team-player-note-workflow';

export async function createTeamNoteFile(
	vault: Vault,
	input: TeamNoteInput,
): Promise<NamedNoteCreationResult<TFile>> {
	const draft = createTeamNoteDraft(input);
	const expectedTeamName = input.name.trim();
	const exactPath = createNamedNotePath(draft.folder, draft.title);
	const existingFile = await getExistingTeamNoteFile(vault, exactPath, expectedTeamName);

	if (existingFile !== null) {
		return {
			file: existingFile,
			existedAlready: true,
		};
	}

	try {
		const createdFile = await createExactNoteFileFromDraft(vault, draft, {
			noteLabel: 'team note',
		});

		return {
			file: createdFile,
			existedAlready: false,
		};
	} catch (error) {
		if (!isAlreadyExistsError(error)) {
			throw error;
		}

		const existingAfterRace = await getExistingTeamNoteFile(vault, exactPath, expectedTeamName);

		if (existingAfterRace !== null) {
			return {
				file: existingAfterRace,
				existedAlready: true,
			};
		}

		throw createExistingNamedNoteCollisionError(exactPath, 'team');
	}
}

export async function createPlayerNoteFile(
	vault: Vault,
	input: PlayerNoteInput,
): Promise<NamedNoteCreationResult<TFile>> {
	const draft = createPlayerNoteDraft(input);
	const expectedPlayerName = input.name.trim();
	const exactPath = createNamedNotePath(draft.folder, draft.title);
	const existingFile = await getExistingPlayerNoteFile(vault, exactPath, expectedPlayerName);

	if (existingFile !== null) {
		return {
			file: existingFile,
			existedAlready: true,
		};
	}

	try {
		const createdFile = await createExactNoteFileFromDraft(vault, draft, {
			noteLabel: 'player note',
		});

		return {
			file: createdFile,
			existedAlready: false,
		};
	} catch (error) {
		if (!isAlreadyExistsError(error)) {
			throw error;
		}

		const existingAfterRace = await getExistingPlayerNoteFile(
			vault,
			exactPath,
			expectedPlayerName,
		);

		if (existingAfterRace !== null) {
			return {
				file: existingAfterRace,
				existedAlready: true,
			};
		}

		throw createExistingNamedNoteCollisionError(exactPath, 'player');
	}
}

async function getExistingTeamNoteFile(
	vault: Vault,
	exactPath: string,
	expectedTeamName: string,
): Promise<TFile | null> {
	const existingFile = vault.getAbstractFileByPath(exactPath);

	if (existingFile === null) {
		return null;
	}

	if (!isTFileLike(existingFile)) {
		throw createExistingNamedNoteFolderError(exactPath, 'team');
	}

	switch (await validateTeamNoteFile(vault, existingFile, expectedTeamName)) {
		case 'match':
			return existingFile;
		case 'mismatch':
			throw createExistingNamedNoteCollisionError(exactPath, 'team');
		default:
			throw createExistingNamedNoteTypeError(exactPath, 'team');
	}
}

async function getExistingPlayerNoteFile(
	vault: Vault,
	exactPath: string,
	expectedPlayerName: string,
): Promise<TFile | null> {
	const existingFile = vault.getAbstractFileByPath(exactPath);

	if (existingFile === null) {
		return null;
	}

	if (!isTFileLike(existingFile)) {
		throw createExistingNamedNoteFolderError(exactPath, 'player');
	}

	switch (await validatePlayerNoteFile(vault, existingFile, expectedPlayerName)) {
		case 'match':
			return existingFile;
		case 'mismatch':
			throw createExistingNamedNoteCollisionError(exactPath, 'player');
		default:
			throw createExistingNamedNoteTypeError(exactPath, 'player');
	}
}

type NamedNoteValidationResult = 'match' | 'mismatch' | 'unsupported';

async function validateTeamNoteFile(
	vault: Vault,
	file: TFile,
	expectedTeamName: string,
): Promise<NamedNoteValidationResult> {
	const content = await vault.read(file);
	const frontmatter = extractFrontmatterLines(content);

	if (frontmatter === null) {
		return 'unsupported';
	}

	const type = getFrontmatterValue(frontmatter, 'type');
	const sport = getFrontmatterValue(frontmatter, 'sport');
	const teamName = getFrontmatterValue(frontmatter, 'team_name');

	if (!isSupportedTeamNoteType(type) || sport !== 'football' || teamName.length === 0) {
		return 'unsupported';
	}

	return teamName === expectedTeamName ? 'match' : 'mismatch';
}

async function validatePlayerNoteFile(
	vault: Vault,
	file: TFile,
	expectedPlayerName: string,
): Promise<NamedNoteValidationResult> {
	const content = await vault.read(file);
	const frontmatter = extractFrontmatterLines(content);

	if (frontmatter === null) {
		return 'unsupported';
	}

	const type = getFrontmatterValue(frontmatter, 'type');
	const sport = getFrontmatterValue(frontmatter, 'sport');
	const playerName = getFrontmatterValue(frontmatter, 'player_name');

	if (!isSupportedPlayerNoteType(type) || sport !== 'football' || playerName.length === 0) {
		return 'unsupported';
	}

	return playerName === expectedPlayerName ? 'match' : 'mismatch';
}

function isSupportedTeamNoteType(value: string): boolean {
	return value === 'team' || value === 'team-note';
}

function isSupportedPlayerNoteType(value: string): boolean {
	return value === 'player' || value === 'player-note';
}

function createExistingNamedNoteTypeError(exactPath: string, noteKind: 'team' | 'player'): Error {
	return new Error(
		`Cannot create ${noteKind} note because "${exactPath}" already exists as a non-${noteKind} file.`,
	);
}

function createExistingNamedNoteCollisionError(
	exactPath: string,
	noteKind: 'team' | 'player',
): Error {
	return new Error(
		`Cannot create ${noteKind} note because "${exactPath}" already exists for a different ${noteKind} note.`,
	);
}

function createExistingNamedNoteFolderError(exactPath: string, noteKind: 'team' | 'player'): Error {
	return new Error(
		`Cannot create ${noteKind} note because "${exactPath}" already exists as a folder.`,
	);
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

function isAlreadyExistsError(error: unknown): boolean {
	return error instanceof Error && error.message.toLowerCase().includes('already exists');
}

function isTFileLike(value: TAbstractFile | null): value is TFile {
	return value !== null && !('children' in value);
}
