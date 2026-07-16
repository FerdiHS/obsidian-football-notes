import { parseMatchUrl, type MatchUrlParseResult } from './match-url-parser';
import type { MatchNoteCreatedFile } from './match-note-workflow';
import {
	normalizeManualMatchDate,
	normalizeRequiredManualMatchNoteField,
	normalizeManualMatchNoteWikiLinkTarget,
	normalizeOptionalManualMatchNoteSourceUrl,
} from './manual-match-note-input';
import type { ManualMatchNoteInput, ManualMatchNoteSubmission } from '../types';

export interface ManualMatchNoteWorkflowDependencies<
	TCreatedFile extends MatchNoteCreatedFile = MatchNoteCreatedFile,
> {
	destinationFolder: string;
	createMatchNoteFile: (input: ManualMatchNoteInput) => Promise<TCreatedFile>;
	openMatchNote: (file: TCreatedFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
	parseMatchUrl?: (input: string) => MatchUrlParseResult;
}

export async function createManualMatchNoteWorkflow<
	TCreatedFile extends MatchNoteCreatedFile = MatchNoteCreatedFile,
>(
	input: ManualMatchNoteSubmission,
	dependencies: ManualMatchNoteWorkflowDependencies<TCreatedFile>,
): Promise<boolean> {
	try {
		const normalizedInput = normalizeManualMatchNoteSubmission(
			input,
			dependencies.parseMatchUrl,
		);

		if (!normalizedInput.ok) {
			dependencies.showNotice(normalizedInput.error.message);
			return false;
		}

		const createdFile = await dependencies.createMatchNoteFile({
			destinationFolder: dependencies.destinationFolder,
			homeTeam: normalizedInput.value.homeTeam,
			awayTeam: normalizedInput.value.awayTeam,
			matchDate: normalizedInput.value.matchDate,
			competition: normalizedInput.value.competition,
			...(normalizedInput.value.source !== undefined
				? { source: normalizedInput.value.source }
				: {}),
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
		dependencies.logError('Failed to create manual match note.', error);
		dependencies.showNotice('Could not create match note. See console for details.');
		return false;
	}
}

function normalizeManualMatchNoteSubmission(
	input: ManualMatchNoteSubmission,
	parseMatchUrlOverride?: (input: string) => MatchUrlParseResult,
):
	| {
			ok: true;
			value: {
				homeTeam: string;
				awayTeam: string;
				matchDate: string;
				competition: string;
				source?: NonNullable<ManualMatchNoteInput['source']>;
			};
	  }
	| {
			ok: false;
			error: {
				message: string;
			};
	  } {
	const homeTeam = normalizeRequiredManualMatchNoteField(input.homeTeam, 'home team');
	if (!homeTeam.ok) {
		return homeTeam;
	}

	const awayTeam = normalizeRequiredManualMatchNoteField(input.awayTeam, 'away team');
	if (!awayTeam.ok) {
		return awayTeam;
	}

	const matchDate = normalizeManualMatchDate(input.matchDate);
	if (!matchDate.ok) {
		return matchDate;
	}

	const competition = normalizeRequiredManualMatchNoteField(input.competition, 'competition');
	if (!competition.ok) {
		return competition;
	}

	const homeTeamLinkTarget = normalizeManualMatchNoteWikiLinkTarget(homeTeam.value, 'home team');
	if (!homeTeamLinkTarget.ok) {
		return homeTeamLinkTarget;
	}

	const awayTeamLinkTarget = normalizeManualMatchNoteWikiLinkTarget(awayTeam.value, 'away team');
	if (!awayTeamLinkTarget.ok) {
		return awayTeamLinkTarget;
	}

	const sourceUrl = normalizeOptionalManualMatchNoteSourceUrl(input.sourceUrl);

	if (sourceUrl !== undefined && sourceUrl.length > 0) {
		const parseResult = (parseMatchUrlOverride ?? parseMatchUrl)(sourceUrl);

		if (!parseResult.ok) {
			return {
				ok: false,
				error: {
					message: parseResult.error.message,
				},
			};
		}

		return {
			ok: true,
			value: {
				homeTeam: homeTeam.value,
				awayTeam: awayTeam.value,
				matchDate: matchDate.value,
				competition: competition.value,
				source: parseResult.value,
			},
		};
	}

	return {
		ok: true,
		value: {
			homeTeam: homeTeam.value,
			awayTeam: awayTeam.value,
			matchDate: matchDate.value,
			competition: competition.value,
		},
	};
}
