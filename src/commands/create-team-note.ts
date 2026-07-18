import type { TFile } from 'obsidian';

import type FootballNotesPlugin from '../main';
import { createTeamNoteFile } from '../services/team-player-note-files';
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

export const CREATE_TEAM_NOTE_COMMAND_ID = 'create-team-note';
export const CREATE_TEAM_NOTE_COMMAND_NAME = 'Create team note';

export interface CreateTeamNoteWorkflowDependencies {
	destinationFolder: string;
	createTeamNoteFile: (input: {
		destinationFolder: string;
		name: string;
	}) => Promise<NamedNoteCreationResult<TFile>>;
	openTeamNote: (file: TFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

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
