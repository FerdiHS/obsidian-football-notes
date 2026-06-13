import { TFile, TFolder, Vault } from 'obsidian';

import type { MatchNoteInput } from '../types';
import { createMatchNotePath, getFolderCreationChain } from './match-note-paths';
import { createMatchNoteDraft } from './match-note-template';

export async function createMatchNoteFile(vault: Vault, input: MatchNoteInput): Promise<TFile> {
	const draft = createMatchNoteDraft(input);
	const now = new Date();

	await ensureFolderExists(vault, draft.folder);

	return await createMatchNoteFileWithRetry(vault, draft.folder, draft.title, now, draft.content);
}

async function createMatchNoteFileWithRetry(
	vault: Vault,
	folder: string,
	title: string,
	now: Date,
	content: string,
): Promise<TFile> {
	let attempt = 1;

	for (;;) {
		const candidatePath = createMatchNotePath(folder, title, now, attempt);

		if (vault.getAbstractFileByPath(candidatePath) !== null) {
			attempt += 1;
			continue;
		}

		try {
			return await vault.create(candidatePath, content);
		} catch (error) {
			if (
				vault.getAbstractFileByPath(candidatePath) !== null ||
				isAlreadyExistsError(error)
			) {
				attempt += 1;
				continue;
			}

			throw error;
		}
	}
}

async function ensureFolderExists(vault: Vault, folder: string): Promise<void> {
	for (const folderPath of getFolderCreationChain(folder)) {
		const existingFile = vault.getAbstractFileByPath(folderPath);

		if (existingFile === null) {
			try {
				await vault.createFolder(folderPath);
			} catch (error) {
				const createdFolder = vault.getAbstractFileByPath(folderPath);

				if (createdFolder instanceof TFolder) {
					continue;
				}

				if (createdFolder !== null) {
					throw new Error(
						`Cannot create match note folder because "${folderPath}" already exists as a file.`,
					);
				}

				if (isAlreadyExistsError(error)) {
					continue;
				}

				throw error;
			}
			continue;
		}

		if (!(existingFile instanceof TFolder)) {
			throw new Error(
				`Cannot create match note folder because "${folderPath}" already exists as a file.`,
			);
		}
	}
}

function isAlreadyExistsError(error: unknown): boolean {
	return error instanceof Error && error.message.toLowerCase().includes('already exists');
}
