import type { App, TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createManualMatchNoteFile } from '../services/match-note-files';
import { createManualMatchNoteWorkflow } from '../services/manual-match-note';
import { resolveManualMatchTeamNotes } from '../services/manual-match-team-notes';
import type { ManualMatchTeamNoteResolution } from '../services/manual-match-team-notes';
import { createTeamNoteFile } from '../services/team-player-note-files';
import type { ManualMatchNoteInput, ManualMatchNoteSubmission } from '../types';
import type { ManualMatchNoteSubmitHandler } from '../ui/manual-match-note-modal';

export const CREATE_MATCH_NOTE_MANUALLY_COMMAND_ID = 'create-match-note-manually';
export const CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME = 'Create match note manually';

export interface CreateMatchNoteManuallyWorkflowDependencies {
	destinationFolder: string;
	resolveTeamNotes: (input: {
		homeTeam: string;
		awayTeam: string;
	}) => Promise<ManualMatchTeamNoteResolution>;
	createMatchNoteFile: (input: ManualMatchNoteInput) => Promise<TFile>;
	openMatchNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export interface CreateMatchNoteManuallyCommandDependencies {
	createModal?: (
		app: App,
		onSubmit: ManualMatchNoteSubmitHandler,
	) => ManualMatchNoteModalLike | Promise<ManualMatchNoteModalLike>;
	showNotice?: (message: string) => void;
	logError?: (message: string, error: unknown) => void;
}

export interface ManualMatchNoteModalLike {
	open(): void;
}

export function registerCreateMatchNoteManuallyCommand(
	plugin: FootballNotesPlugin,
	dependencies: Partial<CreateMatchNoteManuallyCommandDependencies> = {},
): void {
	const showNotice = dependencies.showNotice ?? createDefaultShowNotice();
	const logError = dependencies.logError ?? defaultLogError;

	plugin.addCommand({
		id: CREATE_MATCH_NOTE_MANUALLY_COMMAND_ID,
		name: CREATE_MATCH_NOTE_MANUALLY_COMMAND_NAME,
		callback: async () => {
			try {
				const modal = dependencies.createModal ?? createDefaultManualMatchNoteModal;

				const createdModal = await modal(plugin.app, async (input) => {
					return await createManualMatchNote(input, {
						destinationFolder: plugin.settings.notesFolder,
						resolveTeamNotes: async ({ homeTeam, awayTeam }) => {
							return await resolveManualMatchTeamNotes(
								{
									homeTeam,
									awayTeam,
								},
								{
									teamNotesFolder: plugin.settings.teamNotesFolder,
									createTeamNoteFile: (noteInput) =>
										createTeamNoteFile(plugin.app.vault, noteInput),
								},
							);
						},
						createMatchNoteFile: (matchNoteInput) =>
							createManualMatchNoteFile(plugin.app.vault, matchNoteInput),
						openMatchNote: async (file) => {
							await plugin.app.workspace.getLeaf(false).openFile(file);
						},
						showNotice,
						logError,
					});
				});

				createdModal.open();
			} catch (error) {
				logError('Failed to open manual match note dialog.', error);
				showNotice('Could not open manual match note dialog. See console for details.');
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

async function createDefaultManualMatchNoteModal(
	app: App,
	onSubmit: ManualMatchNoteSubmitHandler,
): Promise<ManualMatchNoteModalLike> {
	const { ManualMatchNoteModal } = await import('../ui/manual-match-note-modal');
	const modal = new ManualMatchNoteModal(app, onSubmit);

	return {
		open: () => {
			modal.open();
		},
	};
}

export async function createManualMatchNote(
	input: ManualMatchNoteSubmission,
	dependencies: CreateMatchNoteManuallyWorkflowDependencies,
): Promise<boolean> {
	return await createManualMatchNoteWorkflow(input, {
		destinationFolder: dependencies.destinationFolder,
		resolveTeamNotes: dependencies.resolveTeamNotes,
		createMatchNoteFile: dependencies.createMatchNoteFile,
		openMatchNote: dependencies.openMatchNote,
		showNotice: dependencies.showNotice,
		logError: dependencies.logError,
	});
}
