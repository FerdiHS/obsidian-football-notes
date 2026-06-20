import type { App, TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createMatchNoteFile } from '../services/match-note-files';
import { parseMatchUrl, type MatchUrlParseResult } from '../services/match-url-parser';
import type { MatchNoteInput } from '../types';
import type { MatchUrlSubmitHandler } from '../ui/match-url-modal';

export const CREATE_MATCH_NOTE_FROM_URL_COMMAND_ID = 'create-match-note-from-url';
export const CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME = 'Create match note from URL';

export interface CreateMatchNoteFromUrlWorkflowDependencies {
	destinationFolder: string;
	parseMatchUrl?: (input: string) => MatchUrlParseResult;
	createMatchNoteFile: (input: MatchNoteInput) => Promise<TFile>;
	openMatchNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export interface CreateMatchNoteFromUrlCommandDependencies {
	createModal?: (
		app: App,
		onSubmit: MatchUrlSubmitHandler,
	) => MatchUrlModalLike | Promise<MatchUrlModalLike>;
	showNotice?: (message: string) => void;
	logError?: (message: string, error: unknown) => void;
}

export interface MatchUrlModalLike {
	open(): void;
}

export function registerCreateMatchNoteFromUrlCommand(
	plugin: FootballNotesPlugin,
	dependencies: Partial<CreateMatchNoteFromUrlCommandDependencies> = {},
): void {
	const showNotice = dependencies.showNotice ?? createDefaultShowNotice();
	const logError = dependencies.logError ?? defaultLogError;

	plugin.addCommand({
		id: CREATE_MATCH_NOTE_FROM_URL_COMMAND_ID,
		name: CREATE_MATCH_NOTE_FROM_URL_COMMAND_NAME,
		callback: async () => {
			try {
				const modal = dependencies.createModal ?? createDefaultMatchUrlModal;

				const createdModal = await modal(plugin.app, async (input) => {
					return await createMatchNoteFromUrl(input, {
						destinationFolder: plugin.settings.notesFolder,
						createMatchNoteFile: (matchNoteInput) =>
							createMatchNoteFile(plugin.app.vault, matchNoteInput),
						openMatchNote: async (file) => {
							await plugin.app.workspace.getLeaf(false).openFile(file);
						},
						showNotice,
						logError,
					});
				});

				createdModal.open();
			} catch (error) {
				logError('Failed to open match note dialog.', error);
				showNotice('Could not open match note dialog. See console for details.');
			}
		},
	});
}

function createDefaultShowNotice(): (message: string) => void {
	return (message: string) => {
		void import('obsidian')
			.then(({ Notice }) => {
				new Notice(message);
			})
			.catch((error) => {
				console.error('Could not show notice.', error, message);
			});
	};
}

function defaultLogError(message: string, error: unknown): void {
	console.error(message, error);
}

async function createDefaultMatchUrlModal(
	app: App,
	onSubmit: MatchUrlSubmitHandler,
): Promise<MatchUrlModalLike> {
	const { MatchUrlModal } = await import('../ui/match-url-modal');
	const modal = new MatchUrlModal(app, onSubmit);

	return {
		open: () => {
			modal.open();
		},
	};
}

export async function createMatchNoteFromUrl(
	input: string,
	dependencies: CreateMatchNoteFromUrlWorkflowDependencies,
): Promise<boolean> {
	const parseResult = (dependencies.parseMatchUrl ?? parseMatchUrl)(input);

	if (!parseResult.ok) {
		dependencies.showNotice(parseResult.error.message);
		return false;
	}

	try {
		const createdFile = await dependencies.createMatchNoteFile({
			source: parseResult.value,
			destinationFolder: dependencies.destinationFolder,
		});

		try {
			await dependencies.openMatchNote(createdFile);
		} catch (error) {
			dependencies.logError('Created match note, but could not open it.', error);
			dependencies.showNotice(
				`Created match note: ${createdFile.name}, but could not open it automatically.`,
			);
			return true;
		}

		dependencies.showNotice(`Created match note: ${createdFile.name}`);
		return true;
	} catch (error) {
		dependencies.logError('Failed to create match note from URL.', error);
		dependencies.showNotice('Could not create match note. See console for details.');
		return false;
	}
}
