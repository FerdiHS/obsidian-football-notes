import { parse as parseYaml } from 'yaml';
import type { TAbstractFile, TFile, Vault } from 'obsidian';

import type { PlayerNoteInput, TeamNoteInput } from '../types';
import { createExactNoteFileFromDraft } from './note-files';
import { createNamedNotePath } from './note-paths';
import { createPlayerNoteDraft, createTeamNoteDraft } from './team-player-note-template';
import type { NamedNoteCreationResult } from './team-player-note-workflow';
import { UserFacingCreateError } from './user-facing-error';

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
	const frontmatter = parseFrontmatter(content);

	if (frontmatter === null) {
		return 'unsupported';
	}

	const type = getFrontmatterString(frontmatter, 'type');
	const sport = getFrontmatterString(frontmatter, 'sport');
	const teamName = getFrontmatterString(frontmatter, 'team_name');

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
	const frontmatter = parseFrontmatter(content);

	if (frontmatter === null) {
		return 'unsupported';
	}

	const type = getFrontmatterString(frontmatter, 'type');
	const sport = getFrontmatterString(frontmatter, 'sport');
	const playerName = getFrontmatterString(frontmatter, 'player_name');

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
	return new UserFacingCreateError(
		`Cannot create ${noteKind} note because "${exactPath}" already exists as a non-${noteKind} file.`,
	);
}

function createExistingNamedNoteCollisionError(
	exactPath: string,
	noteKind: 'team' | 'player',
): Error {
	return new UserFacingCreateError(
		`Cannot create ${noteKind} note because "${exactPath}" already exists for a different ${noteKind} note.`,
	);
}

function createExistingNamedNoteFolderError(exactPath: string, noteKind: 'team' | 'player'): Error {
	return new UserFacingCreateError(
		`Cannot create ${noteKind} note because "${exactPath}" already exists as a folder.`,
	);
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
	const normalizedContent = content.replace(/\r\n/g, '\n');

	if (!normalizedContent.startsWith('---\n')) {
		return null;
	}

	for (let lineStartIndex = 4; lineStartIndex <= normalizedContent.length; ) {
		const lineEndIndex = normalizedContent.indexOf('\n', lineStartIndex);
		const line = normalizedContent.slice(
			lineStartIndex,
			lineEndIndex === -1 ? normalizedContent.length : lineEndIndex,
		);

		if (line === '---') {
			return parseYamlFrontmatter(normalizedContent.slice(4, lineStartIndex - 1));
		}

		if (lineEndIndex === -1) {
			return null;
		}

		lineStartIndex = lineEndIndex + 1;
	}

	return null;
}

function parseYamlFrontmatter(frontmatter: string): Record<string, unknown> | null {
	let parsedFrontmatter: unknown;

	try {
		parsedFrontmatter = parseYaml(frontmatter);
	} catch {
		return null;
	}

	return isRecord(parsedFrontmatter) ? parsedFrontmatter : null;
}

function getFrontmatterString(frontmatter: Record<string, unknown>, key: string): string {
	const value = frontmatter[key];

	return typeof value === 'string' ? value : '';
}

function isAlreadyExistsError(error: unknown): boolean {
	return error instanceof Error && error.message.toLowerCase().includes('already exists');
}

function isTFileLike(value: TAbstractFile | null): value is TFile {
	return value !== null && !('children' in value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
