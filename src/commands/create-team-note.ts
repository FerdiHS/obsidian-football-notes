import type { App, TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createTeamNoteFile } from '../services/team-player-note-files';
import { createNamedNoteWorkflow } from '../services/team-player-note-workflow';
import type { NamedNoteSubmitHandler } from '../ui/named-note-modal';

export const CREATE_TEAM_NOTE_COMMAND_ID = 'create-team-note';
export const CREATE_TEAM_NOTE_COMMAND_NAME = 'Create team note';

export interface CreateTeamNoteWorkflowDependencies {
	destinationFolder: string;
	createTeamNoteFile: (input: { destinationFolder: string; name: string }) => Promise<TFile>;
	openTeamNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export interface CreateTeamNoteCommandDependencies {
	createModal?: (
		app: App,
		onSubmit: NamedNoteSubmitHandler,
	) => TeamNoteModalLike | Promise<TeamNoteModalLike>;
	showNotice?: (message: string) => void;
	logError?: (message: string, error: unknown) => void;
}

export interface TeamNoteModalLike {
	open(): void;
}

export function registerCreateTeamNoteCommand(
	plugin: FootballNotesPlugin,
	dependencies: Partial<CreateTeamNoteCommandDependencies> = {},
): void {
	const showNotice = dependencies.showNotice ?? createDefaultShowNotice();
	const logError = dependencies.logError ?? defaultLogError;

	plugin.addCommand({
		id: CREATE_TEAM_NOTE_COMMAND_ID,
		name: CREATE_TEAM_NOTE_COMMAND_NAME,
		callback: async () => {
			try {
				const createModal = dependencies.createModal ?? createDefaultTeamNoteModal;

				const createdModal = await createModal(plugin.app, async (input) => {
					return await createTeamNote(input, {
						destinationFolder: plugin.settings.teamNotesFolder,
						createTeamNoteFile: (noteInput) =>
							createTeamNoteFile(plugin.app.vault, noteInput),
						openTeamNote: async (file) => {
							await plugin.app.workspace.getLeaf(false).openFile(file);
						},
						showNotice,
						logError,
					});
				});

				createdModal.open();
			} catch (error) {
				logError('Failed to open team note dialog.', error);
				showNotice('Could not open team note dialog. See console for details.');
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

async function createDefaultTeamNoteModal(
	app: App,
	onSubmit: NamedNoteSubmitHandler,
): Promise<TeamNoteModalLike> {
	const { NamedNoteModal } = await import('../ui/named-note-modal');
	const modal = new NamedNoteModal(
		app,
		{
			title: 'Create team note',
			description: 'Enter a team name to create a new team note.',
			fieldLabel: 'Team name',
			placeholder: 'Real Madrid',
			submitLabel: 'Create note',
		},
		onSubmit,
	);

	return {
		open: () => {
			modal.open();
		},
	};
}

export async function createTeamNote(
	input: string,
	dependencies: CreateTeamNoteWorkflowDependencies,
): Promise<boolean> {
	return await createNamedNoteWorkflow(input, {
		destinationFolder: dependencies.destinationFolder,
		noteKind: 'team',
		createNoteFile: dependencies.createTeamNoteFile,
		openNote: dependencies.openTeamNote,
		showNotice: dependencies.showNotice,
		logError: dependencies.logError,
	});
}
