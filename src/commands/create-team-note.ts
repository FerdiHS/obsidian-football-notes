import type { TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createTeamNoteFile } from '../services/team-player-note-files';
import {
	registerNamedNoteCommand,
	type NamedNoteCommandDefinition,
	type NamedNoteCommandDependencies,
	type NamedNoteModalLike,
} from './register-named-note-command';

export const CREATE_TEAM_NOTE_COMMAND_ID = 'create-team-note';
export const CREATE_TEAM_NOTE_COMMAND_NAME = 'Create team note';

export type CreateTeamNoteCommandDependencies = NamedNoteCommandDependencies;
export type TeamNoteModalLike = NamedNoteModalLike;

const teamNoteCommandDefinition: NamedNoteCommandDefinition<TFile> = {
	id: CREATE_TEAM_NOTE_COMMAND_ID,
	name: CREATE_TEAM_NOTE_COMMAND_NAME,
	noteKind: 'team',
	getDestinationFolder: (plugin) => plugin.settings.teamNotesFolder,
	modalConfig: {
		title: 'Create team note',
		description: 'Enter a team name to create a new team note.',
		fieldLabel: 'Team name',
		placeholder: 'Real Madrid',
		submitLabel: 'Create note',
	},
	createNoteFile: (plugin, input) => createTeamNoteFile(plugin.app.vault, input),
	openNote: async (plugin, file) => {
		await plugin.app.workspace.getLeaf(false).openFile(file);
	},
};

export function registerCreateTeamNoteCommand(
	plugin: FootballNotesPlugin,
	dependencies: CreateTeamNoteCommandDependencies = {},
): void {
	registerNamedNoteCommand(plugin, teamNoteCommandDefinition, dependencies);
}
