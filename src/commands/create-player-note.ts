import type { TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createPlayerNoteFile } from '../services/team-player-note-files';
import {
	registerNamedNoteCommand,
	type NamedNoteCommandDefinition,
	type NamedNoteCommandDependencies,
	type NamedNoteModalLike,
} from './register-named-note-command';

export const CREATE_PLAYER_NOTE_COMMAND_ID = 'create-player-note';
export const CREATE_PLAYER_NOTE_COMMAND_NAME = 'Create player note';

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
