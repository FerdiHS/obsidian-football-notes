import { normalizeMatchNotesFolder } from '../types';
import type { ManualMatchNoteInput, MatchNoteDraft, MatchNoteInput } from '../types';
import {
	normalizeManualMatchDate,
	normalizeRequiredManualMatchNoteField,
	normalizeManualMatchNoteWikiLinkTarget,
	normalizeOptionalManualMatchNoteSourceUrl,
	type ManualMatchNoteValidationResult,
} from './manual-match-note-input';
import { toVaultRelativeNoteTarget } from './note-paths';

const MATCH_NOTE_FRONTMATTER = {
	type: 'match-note',
	sport: 'football',
	homeTeamNoteKey: 'home_team_note',
	awayTeamNoteKey: 'away_team_note',
	sourceUrlKey: 'source_url',
} as const;

const MATCH_NOTE_SECTIONS = [
	'Snapshot',
	'Lineups',
	'Match stats',
	'Timeline',
	'My observations',
	'Tactical notes',
] as const;

export function createMatchNoteDraft(input: MatchNoteInput): MatchNoteDraft {
	const destinationFolder = normalizeMatchNotesFolder(input.destinationFolder);
	const sourceUrl = input.source.sourceUrl.trim();

	if (sourceUrl.length === 0) {
		throw new Error('Match note source URL cannot be empty.');
	}

	return {
		title: 'New match note',
		folder: destinationFolder,
		content: buildMatchNoteMarkdown({
			sourceUrl,
		}),
	};
}

export function createManualMatchNoteDraft(input: ManualMatchNoteInput): MatchNoteDraft {
	const destinationFolder = normalizeMatchNotesFolder(input.destinationFolder);
	const homeTeam = requireManualMatchNoteValue(
		normalizeRequiredManualMatchNoteField(input.homeTeam, 'home team'),
	);
	const awayTeam = requireManualMatchNoteValue(
		normalizeRequiredManualMatchNoteField(input.awayTeam, 'away team'),
	);
	const matchDate = requireManualMatchNoteValue(normalizeManualMatchDate(input.matchDate));
	const competition = requireManualMatchNoteValue(
		normalizeRequiredManualMatchNoteField(input.competition, 'competition'),
	);
	requireManualMatchNoteValue(normalizeManualMatchNoteWikiLinkTarget(homeTeam, 'home team'));
	requireManualMatchNoteValue(normalizeManualMatchNoteWikiLinkTarget(awayTeam, 'away team'));
	const homeTeamNotePath = normalizeManualMatchNotePath(
		input.homeTeamNotePath,
		'home team note path',
	);
	const awayTeamNotePath = normalizeManualMatchNotePath(
		input.awayTeamNotePath,
		'away team note path',
	);
	const sourceUrl = normalizeOptionalManualMatchNoteSourceUrl(input.source?.sourceUrl);
	const title = `${homeTeam} vs ${awayTeam} ${matchDate}`;

	return {
		title,
		folder: destinationFolder,
		content: buildMatchNoteMarkdown({
			homeTeamNotePath,
			awayTeamNotePath,
			snapshotLines: buildManualMatchSnapshotLines({
				competition,
				homeTeamNotePath,
				matchDate,
				awayTeamNotePath,
				sourceUrl,
			}),
			sourceUrl,
		}),
	};
}

function buildMatchNoteMarkdown(options: {
	homeTeamNotePath?: string;
	awayTeamNotePath?: string;
	sourceUrl?: string;
	snapshotLines?: readonly string[];
}): string {
	const sectionHeadings: string[] = [];

	for (const section of MATCH_NOTE_SECTIONS) {
		if (section === 'Snapshot' && options.snapshotLines !== undefined) {
			sectionHeadings.push(`## ${section}`, '', ...options.snapshotLines, '');
			continue;
		}

		sectionHeadings.push(`## ${section}`, '');
	}

	const frontmatter = [
		'---',
		`type: ${MATCH_NOTE_FRONTMATTER.type}`,
		`sport: ${MATCH_NOTE_FRONTMATTER.sport}`,
	];

	if (options.homeTeamNotePath !== undefined) {
		frontmatter.push(
			`${MATCH_NOTE_FRONTMATTER.homeTeamNoteKey}: ${formatFrontmatterString(options.homeTeamNotePath)}`,
		);
	}

	if (options.awayTeamNotePath !== undefined) {
		frontmatter.push(
			`${MATCH_NOTE_FRONTMATTER.awayTeamNoteKey}: ${formatFrontmatterString(options.awayTeamNotePath)}`,
		);
	}

	if (options.sourceUrl !== undefined) {
		frontmatter.push(
			`${MATCH_NOTE_FRONTMATTER.sourceUrlKey}: ${formatFrontmatterString(options.sourceUrl)}`,
		);
	}

	return [...frontmatter, '---', '', '# Match', '', ...sectionHeadings].join('\n');
}

function formatFrontmatterString(value: string): string {
	return JSON.stringify(value);
}

function buildManualMatchSnapshotLines(input: {
	competition: string;
	homeTeamNotePath: string;
	matchDate: string;
	awayTeamNotePath: string;
	sourceUrl?: string;
}): string[] {
	const lines = [
		`- Home team: ${formatWikiLink(input.homeTeamNotePath)}`,
		`- Away team: ${formatWikiLink(input.awayTeamNotePath)}`,
		`- Match date: ${input.matchDate}`,
		`- Competition: ${input.competition}`,
	];

	if (input.sourceUrl !== undefined && input.sourceUrl.length > 0) {
		lines.push(`- Source URL: ${input.sourceUrl}`);
	}

	return lines;
}

function formatWikiLink(notePath: string): string {
	return `[[${escapeWikiLinkTarget(toVaultRelativeNoteTarget(notePath))}]]`;
}

function escapeWikiLinkTarget(value: string): string {
	return value.replace(/([\\[\]|#^])/g, '\\$1');
}

function normalizeManualMatchNotePath(value: string, fieldName: string): string {
	const normalizedPath = toVaultRelativeNoteTarget(value);

	if (normalizedPath.length === 0) {
		throw new Error(`Manual match note ${fieldName} cannot be empty.`);
	}

	return normalizedPath;
}

function requireManualMatchNoteValue<T>(result: ManualMatchNoteValidationResult<T>): T {
	if (!result.ok) {
		throw new Error(result.error.message);
	}

	return result.value;
}
