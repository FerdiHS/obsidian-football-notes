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
	deleteTeamNoteFile: (file: ManualMatchTeamNoteFileLike) => Promise<void>;
	logError: (message: string, error: unknown) => void;
	showNotice?: (message: string) => void;
}

export async function resolveManualMatchTeamNotes(
	input: {
		homeTeam: string;
		awayTeam: string;
	},
	dependencies: ManualMatchTeamNoteResolverDependencies,
): Promise<ManualMatchTeamNoteResolution> {
	const homeTeam = await resolveManualMatchTeamNote(input.homeTeam, dependencies);

	try {
		const awayTeam = await resolveManualMatchTeamNote(input.awayTeam, dependencies);

		return {
			homeTeam,
			awayTeam,
		};
	} catch (error) {
		if (!homeTeam.existedAlready) {
			try {
				await dependencies.deleteTeamNoteFile(homeTeam.file);
			} catch (cleanupError) {
				dependencies.logError(
					'Failed to roll back created home team note after away team note resolution failed.',
					cleanupError,
				);
				dependencies.showNotice?.(
					`Could not remove created home team note: ${homeTeam.fileName}. Please review it manually.`,
				);
			}
		}

		throw error;
	}
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
