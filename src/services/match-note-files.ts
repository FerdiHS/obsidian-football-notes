import type { TFile, Vault } from 'obsidian';

import type { ManualMatchNoteInput, MatchNoteDraft, MatchNoteInput } from '../types';
import { createManualMatchNoteDraft, createMatchNoteDraft } from './match-note-template';
import { createNoteFileFromDraft } from './note-files';
import { createMatchNotePath } from './match-note-paths';

export async function createMatchNoteFile(vault: Vault, input: MatchNoteInput): Promise<TFile> {
	return await createMatchNoteFileFromDraft(vault, createMatchNoteDraft(input));
}

export async function createManualMatchNoteFile(
	vault: Vault,
	input: ManualMatchNoteInput,
): Promise<TFile> {
	return await createMatchNoteFileFromDraft(vault, createManualMatchNoteDraft(input));
}

export async function createMatchNoteFileFromDraft(
	vault: Vault,
	draft: MatchNoteDraft,
): Promise<TFile> {
	const now = new Date();

	return await createNoteFileFromDraft(vault, draft, {
		createPath: (folder, title, attempt = 1) =>
			createMatchNotePath(folder, title, now, attempt),
		noteLabel: 'match note',
	});
}
