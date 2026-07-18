import type { App } from 'obsidian';

import type FootballNotesPlugin from '../main';
import {
	createNamedNoteWorkflow,
	type NamedNoteCreatedFile,
	type NamedNoteCreationResult,
	type NamedNoteInput,
} from '../services/team-player-note-workflow';
import type { NamedNoteModalConfig, NamedNoteSubmitHandler } from '../ui/named-note-modal';

export interface NamedNoteModalLike {
	open(): void;
}

export interface NamedNoteCommandDependencies {
	createModal?: (
		app: App,
		config: NamedNoteModalConfig,
		onSubmit: NamedNoteSubmitHandler,
	) => NamedNoteModalLike | Promise<NamedNoteModalLike>;
	showNotice?: (message: string) => void;
	logError?: (message: string, error: unknown) => void;
}

export interface NamedNoteCommandDefinition<
	TCreatedFile extends NamedNoteCreatedFile = NamedNoteCreatedFile,
> {
	id: string;
	name: string;
	noteKind: 'team' | 'player';
	getDestinationFolder: (plugin: FootballNotesPlugin) => string;
	modalConfig: NamedNoteModalConfig;
	createNoteFile: (
		plugin: FootballNotesPlugin,
		input: NamedNoteInput,
	) => Promise<NamedNoteCreationResult<TCreatedFile>>;
	openNote: (plugin: FootballNotesPlugin, file: TCreatedFile) => Promise<void>;
}

export function registerNamedNoteCommand<
	TCreatedFile extends NamedNoteCreatedFile = NamedNoteCreatedFile,
>(
	plugin: FootballNotesPlugin,
	definition: NamedNoteCommandDefinition<TCreatedFile>,
	dependencies: NamedNoteCommandDependencies = {},
): void {
	const showNotice = dependencies.showNotice ?? createDefaultShowNotice();
	const logError = dependencies.logError ?? defaultLogError;

	plugin.addCommand({
		id: definition.id,
		name: definition.name,
		callback: async () => {
			try {
				const createModal = dependencies.createModal ?? createDefaultNamedNoteModal;
				const createdModal = await createModal(
					plugin.app,
					definition.modalConfig,
					async (input) => {
						return await createNamedNoteWorkflow(input, {
							destinationFolder: definition.getDestinationFolder(plugin),
							noteKind: definition.noteKind,
							createNoteFile: (noteInput) =>
								definition.createNoteFile(plugin, noteInput),
							openNote: (file) => definition.openNote(plugin, file),
							showNotice,
							logError,
						});
					},
				);

				createdModal.open();
			} catch (error) {
				logError(`Failed to open ${definition.noteKind} note dialog.`, error);
				showNotice(
					`Could not open ${definition.noteKind} note dialog. See console for details.`,
				);
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

async function createDefaultNamedNoteModal(
	app: App,
	config: NamedNoteModalConfig,
	onSubmit: NamedNoteSubmitHandler,
): Promise<NamedNoteModalLike> {
	const { NamedNoteModal } = await import('../ui/named-note-modal');
	const modal = new NamedNoteModal(app, config, onSubmit);

	return {
		open: () => {
			modal.open();
		},
	};
}
