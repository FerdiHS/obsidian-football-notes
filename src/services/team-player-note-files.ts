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
	const existingFile = getExistingNoteFile(vault, draft.folder, draft.title);

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
	const existingFile = getExistingNoteFile(vault, draft.folder, draft.title);

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

function getExistingNoteFile(vault: Vault, folder: string, title: string): TFile | null {
	const exactPath = createNamedNotePath(folder, title);
	const existingFile = vault.getAbstractFileByPath(exactPath);

	if (!isTFileLike(existingFile)) {
		return null;
	}

	return existingFile;
}

function isTFileLike(value: TAbstractFile | null): value is TFile {
	return value !== null && !('children' in value);
}
