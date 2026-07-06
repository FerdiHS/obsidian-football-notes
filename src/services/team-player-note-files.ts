import type { TFile, Vault } from 'obsidian';

import type { PlayerNoteInput, TeamNoteInput } from '../types';
import { createNoteFileFromDraft } from './note-files';
import { createPlayerNoteDraft, createTeamNoteDraft } from './team-player-note-template';

export async function createTeamNoteFile(vault: Vault, input: TeamNoteInput): Promise<TFile> {
	return await createNoteFileFromDraft(vault, createTeamNoteDraft(input), {
		noteLabel: 'team note',
	});
}

export async function createPlayerNoteFile(vault: Vault, input: PlayerNoteInput): Promise<TFile> {
	return await createNoteFileFromDraft(vault, createPlayerNoteDraft(input), {
		noteLabel: 'player note',
	});
}
