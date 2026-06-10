import { TFile, TFolder, Vault } from 'obsidian';

import type { MatchNoteInput } from '../types';
import { createMatchNotePath, getFolderCreationChain } from './match-note-paths';
import { createMatchNoteDraft } from './match-note-template';

export async function createMatchNoteFile(vault: Vault, input: MatchNoteInput): Promise<TFile> {
	const draft = createMatchNoteDraft(input);
	const now = new Date();

	await ensureFolderExists(vault, draft.folder);

	const filePath = findAvailableMatchNotePath(vault, draft.folder, draft.title, now);

	return await vault.create(filePath, draft.content);
}

function findAvailableMatchNotePath(
	vault: Vault,
	folder: string,
	title: string,
	now: Date,
): string {
	let attempt = 1;

	for (;;) {
		const candidatePath = createMatchNotePath(folder, title, now, attempt);

		if (vault.getAbstractFileByPath(candidatePath) === null) {
			return candidatePath;
		}

		attempt += 1;
	}
}

async function ensureFolderExists(vault: Vault, folder: string): Promise<void> {
	for (const folderPath of getFolderCreationChain(folder)) {
		const existingFile = vault.getAbstractFileByPath(folderPath);

		if (existingFile === null) {
			await vault.createFolder(folderPath);
			continue;
		}

		if (!(existingFile instanceof TFolder)) {
			throw new Error(
				`Cannot create match note folder because "${folderPath}" already exists as a file.`,
			);
		}
	}
}
