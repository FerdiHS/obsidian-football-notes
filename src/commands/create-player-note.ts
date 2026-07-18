import type { TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createPlayerNoteFile } from '../services/team-player-note-files';
import {
	createNamedNoteWorkflow,
	type NamedNoteCreationResult,
} from '../services/team-player-note-workflow';
import {
	registerNamedNoteCommand,
	type NamedNoteCommandDefinition,
	type NamedNoteCommandDependencies,
	type NamedNoteModalLike,
} from './register-named-note-command';

export const CREATE_PLAYER_NOTE_COMMAND_ID = 'create-player-note';
export const CREATE_PLAYER_NOTE_COMMAND_NAME = 'Create player note';

export interface CreatePlayerNoteWorkflowDependencies {
	destinationFolder: string;
	createPlayerNoteFile: (input: {
		destinationFolder: string;
		name: string;
	}) => Promise<NamedNoteCreationResult<TFile>>;
	openPlayerNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export type CreatePlayerNoteCommandDependencies = NamedNoteCommandDependencies;
export type PlayerNoteModalLike = NamedNoteModalLike;

const playerNoteCommandDefinition: NamedNoteCommandDefinition<TFile> = {
	id: CREATE_PLAYER_NOTE_COMMAND_ID,
	name: CREATE_PLAYER_NOTE_COMMAND_NAME,
	noteKind: 'player',
	getDestinationFolder: (plugin) => plugin.settings.playerNotesFolder,
	modalConfig: {
		title: 'Create player note',
		description: 'Enter a player name to create a new player note.',
		fieldLabel: 'Player name',
		placeholder: 'Lamine Yamal',
		submitLabel: 'Create note',
	},
	createNoteFile: (plugin, input) => createPlayerNoteFile(plugin.app.vault, input),
	openNote: async (plugin, file) => {
		await plugin.app.workspace.getLeaf(false).openFile(file);
	},
};

export function registerCreatePlayerNoteCommand(
	plugin: FootballNotesPlugin,
	dependencies: CreatePlayerNoteCommandDependencies = {},
): void {
	registerNamedNoteCommand(plugin, playerNoteCommandDefinition, dependencies);
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
