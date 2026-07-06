import type { App, TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createPlayerNoteFile } from '../services/team-player-note-files';
import { createNamedNoteWorkflow } from '../services/team-player-note-workflow';
import type { NamedNoteSubmitHandler } from '../ui/named-note-modal';

export const CREATE_PLAYER_NOTE_COMMAND_ID = 'create-player-note';
export const CREATE_PLAYER_NOTE_COMMAND_NAME = 'Create player note';

export interface CreatePlayerNoteWorkflowDependencies {
	destinationFolder: string;
	createPlayerNoteFile: (input: { destinationFolder: string; name: string }) => Promise<TFile>;
	openPlayerNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export interface CreatePlayerNoteCommandDependencies {
	createModal?: (
		app: App,
		onSubmit: NamedNoteSubmitHandler,
	) => PlayerNoteModalLike | Promise<PlayerNoteModalLike>;
	showNotice?: (message: string) => void;
	logError?: (message: string, error: unknown) => void;
}

export interface PlayerNoteModalLike {
	open(): void;
}

export function registerCreatePlayerNoteCommand(
	plugin: FootballNotesPlugin,
	dependencies: Partial<CreatePlayerNoteCommandDependencies> = {},
): void {
	const showNotice = dependencies.showNotice ?? createDefaultShowNotice();
	const logError = dependencies.logError ?? defaultLogError;

	plugin.addCommand({
		id: CREATE_PLAYER_NOTE_COMMAND_ID,
		name: CREATE_PLAYER_NOTE_COMMAND_NAME,
		callback: async () => {
			try {
				const createModal = dependencies.createModal ?? createDefaultPlayerNoteModal;

				const createdModal = await createModal(plugin.app, async (input) => {
					return await createPlayerNote(input, {
						destinationFolder: plugin.settings.playerNotesFolder,
						createPlayerNoteFile: (noteInput) =>
							createPlayerNoteFile(plugin.app.vault, noteInput),
						openPlayerNote: async (file) => {
							await plugin.app.workspace.getLeaf(false).openFile(file);
						},
						showNotice,
						logError,
					});
				});

				createdModal.open();
			} catch (error) {
				logError('Failed to open player note dialog.', error);
				showNotice('Could not open player note dialog. See console for details.');
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

async function createDefaultPlayerNoteModal(
	app: App,
	onSubmit: NamedNoteSubmitHandler,
): Promise<PlayerNoteModalLike> {
	const { NamedNoteModal } = await import('../ui/named-note-modal');
	const modal = new NamedNoteModal(
		app,
		{
			title: 'Create player note',
			description: 'Enter a player name to create a new player note.',
			fieldLabel: 'Player name',
			placeholder: 'Lamine Yamal',
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

export async function createPlayerNote(
	input: string,
	dependencies: CreatePlayerNoteWorkflowDependencies,
): Promise<boolean> {
	return await createNamedNoteWorkflow(input, {
		destinationFolder: dependencies.destinationFolder,
		noteKind: 'player',
		createNoteFile: dependencies.createPlayerNoteFile,
		openNote: dependencies.openPlayerNote,
		showNotice: dependencies.showNotice,
		logError: dependencies.logError,
	});
}
