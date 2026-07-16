import type { TFile, Vault } from 'obsidian';

import type { ManualMatchNoteInput, MatchNoteDraft, MatchNoteInput } from '../types';
import { createMatchNotePath, getFolderCreationChain } from './match-note-paths';
import { createManualMatchNoteDraft, createMatchNoteDraft } from './match-note-template';

const MAX_MATCH_NOTE_CREATE_ATTEMPTS = 100;

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
	for (let attempt = 1; attempt <= MAX_MATCH_NOTE_CREATE_ATTEMPTS; attempt += 1) {
		const candidatePath = createMatchNotePath(folder, title, now, attempt);

		if (vault.getAbstractFileByPath(candidatePath) !== null) {
			continue;
		}

		try {
			return await vault.create(candidatePath, content);
		} catch (error) {
			if (
				vault.getAbstractFileByPath(candidatePath) !== null ||
				isAlreadyExistsError(error)
			) {
				if (attempt === MAX_MATCH_NOTE_CREATE_ATTEMPTS) {
					throw createMatchNoteRetryLimitError(
						title,
						folder,
						MAX_MATCH_NOTE_CREATE_ATTEMPTS,
					);
				}

				continue;
			}

			throw error;
		}
	}

	throw createMatchNoteRetryLimitError(title, folder, MAX_MATCH_NOTE_CREATE_ATTEMPTS);
}

async function ensureFolderExists(vault: Vault, folder: string): Promise<void> {
	for (const folderPath of getFolderCreationChain(folder)) {
		const existingFile = vault.getAbstractFileByPath(folderPath);

		if (existingFile === null) {
			try {
				await vault.createFolder(folderPath);
			} catch (error) {
				const createdFolder = vault.getAbstractFileByPath(folderPath);

				if (isFolderLike(createdFolder)) {
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

		if (!isFolderLike(existingFile)) {
			throw new Error(
				`Cannot create match note folder because "${folderPath}" already exists as a file.`,
			);
		}
	}
}

function isAlreadyExistsError(error: unknown): boolean {
	return error instanceof Error && error.message.toLowerCase().includes('already exists');
}

function isFolderLike(value: unknown): value is { children: unknown[] } {
	return typeof value === 'object' && value !== null && 'children' in value;
}

function createMatchNoteRetryLimitError(title: string, folder: string, attempts: number): Error {
	return new Error(
		`Could not create match note "${title}" in "${folder}" after ${attempts} attempts.`,
	);
}
