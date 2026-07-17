import type { TFile, Vault } from 'obsidian';

import { createNamedNotePath, getFolderCreationChain } from './note-paths';

const MAX_NOTE_CREATE_ATTEMPTS = 100;

export interface NoteDraft {
	title: string;
	folder: string;
	content: string;
}

export interface NoteFileCreationOptions {
	createPath?: NotePathFactory;
	noteLabel?: string;
}

export interface ExactNoteFileCreationOptions {
	noteLabel?: string;
}

export type NotePathFactory = (folder: string, title: string, attempt?: number) => string;

export async function createNoteFileFromDraft(
	vault: Vault,
	draft: NoteDraft,
	options: NoteFileCreationOptions = {},
): Promise<TFile> {
	const noteLabel = options.noteLabel ?? 'note';

	await ensureFolderExists(vault, draft.folder, noteLabel);

	return await createNoteFileWithRetry(
		vault,
		draft.folder,
		draft.title,
		draft.content,
		options.createPath ?? createNamedNotePath,
		noteLabel,
	);
}

export async function createExactNoteFileFromDraft(
	vault: Vault,
	draft: NoteDraft,
	options: ExactNoteFileCreationOptions = {},
): Promise<TFile> {
	const noteLabel = options.noteLabel ?? 'note';

	await ensureFolderExists(vault, draft.folder, noteLabel);

	return await vault.create(createNamedNotePath(draft.folder, draft.title), draft.content);
}

async function createNoteFileWithRetry(
	vault: Vault,
	folder: string,
	title: string,
	content: string,
	createPath: NotePathFactory,
	noteLabel: string,
): Promise<TFile> {
	for (let attempt = 1; attempt <= MAX_NOTE_CREATE_ATTEMPTS; attempt += 1) {
		const candidatePath = createPath(folder, title, attempt);

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
				if (attempt === MAX_NOTE_CREATE_ATTEMPTS) {
					throw createNoteRetryLimitError(
						title,
						folder,
						MAX_NOTE_CREATE_ATTEMPTS,
						noteLabel,
					);
				}

				continue;
			}

			throw error;
		}
	}

	throw createNoteRetryLimitError(title, folder, MAX_NOTE_CREATE_ATTEMPTS, noteLabel);
}

async function ensureFolderExists(vault: Vault, folder: string, noteLabel: string): Promise<void> {
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
						`Cannot create ${noteLabel} folder because "${folderPath}" already exists as a file.`,
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
				`Cannot create ${noteLabel} folder because "${folderPath}" already exists as a file.`,
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

function createNoteRetryLimitError(
	title: string,
	folder: string,
	attempts: number,
	noteLabel: string,
): Error {
	return new Error(
		`Could not create ${noteLabel} "${title}" in "${folder}" after ${attempts} attempts.`,
	);
}
