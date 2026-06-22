import { parseMatchUrl, type MatchUrlParseResult } from './match-url-parser';
import type { MatchNoteInput } from '../types';

export interface MatchNoteCreatedFile {
	name: string;
}

export interface MatchNoteWorkflowDependencies {
	destinationFolder: string;
	parseMatchUrl?: (input: string) => MatchUrlParseResult;
	createMatchNoteFile: (input: MatchNoteInput) => Promise<MatchNoteCreatedFile>;
	openMatchNote: (file: MatchNoteCreatedFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export async function createMatchNoteFromUrlWorkflow(
	input: string,
	dependencies: MatchNoteWorkflowDependencies,
): Promise<boolean> {
	const parseResult = (dependencies.parseMatchUrl ?? parseMatchUrl)(input);

	if (!parseResult.ok) {
		dependencies.showNotice(parseResult.error.message);
		return false;
	}

	try {
		const createdFile = await dependencies.createMatchNoteFile({
			source: parseResult.value,
			destinationFolder: dependencies.destinationFolder,
		});

		try {
			await dependencies.openMatchNote(createdFile);
		} catch (error) {
			dependencies.logError('Created match note, but could not open it.', error);
			dependencies.showNotice(
				`Created match note: ${createdFile.name}, but could not open it automatically.`,
			);
			return true;
		}

		dependencies.showNotice(`Created match note: ${createdFile.name}`);
		return true;
	} catch (error) {
		dependencies.logError('Failed to create match note from URL.', error);
		dependencies.showNotice('Could not create match note. See console for details.');
		return false;
	}
}
