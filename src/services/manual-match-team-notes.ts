import type { TeamNoteInput } from '../types';
import { toVaultRelativeNoteTarget } from './note-paths';
import type { NamedNoteCreationResult } from './team-player-note-workflow';

export interface ManualMatchTeamNoteFileLike {
	path: string;
	name: string;
}

export interface ManualMatchTeamNoteResult {
	notePath: string;
	existedAlready: boolean;
	fileName: string;
	file: ManualMatchTeamNoteFileLike;
}

export interface ManualMatchTeamNoteResolution {
	homeTeam: ManualMatchTeamNoteResult;
	awayTeam: ManualMatchTeamNoteResult;
}

export interface ManualMatchTeamNoteResolverDependencies {
	teamNotesFolder: string;
	createTeamNoteFile: (
		input: TeamNoteInput,
	) => Promise<NamedNoteCreationResult<ManualMatchTeamNoteFileLike>>;
	logError: (message: string, error: unknown) => void;
}

export async function resolveManualMatchTeamNotes(
	input: {
		homeTeam: string;
		awayTeam: string;
	},
	dependencies: ManualMatchTeamNoteResolverDependencies,
): Promise<ManualMatchTeamNoteResolution> {
	const homeTeam = await resolveManualMatchTeamNote(input.homeTeam, dependencies);
	const awayTeam = await resolveManualMatchTeamNote(input.awayTeam, dependencies);

	return {
		homeTeam,
		awayTeam,
	};
}

async function resolveManualMatchTeamNote(
	name: string,
	dependencies: ManualMatchTeamNoteResolverDependencies,
): Promise<ManualMatchTeamNoteResult> {
	const createdResult = await dependencies.createTeamNoteFile({
		destinationFolder: dependencies.teamNotesFolder,
		name,
	});

	return {
		notePath: toVaultRelativeNoteTarget(createdResult.file.path),
		existedAlready: createdResult.existedAlready,
		fileName: createdResult.file.name,
		file: createdResult.file,
	};
}
