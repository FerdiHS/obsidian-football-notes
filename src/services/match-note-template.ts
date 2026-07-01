import { normalizeMatchNotesFolder } from '../types';
import type { ManualMatchNoteInput, MatchNoteDraft, MatchNoteInput } from '../types';

const MATCH_NOTE_FRONTMATTER = {
	type: 'match-note',
	sport: 'football',
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
	const homeTeam = normalizeManualMatchNoteField(input.homeTeam, 'home team');
	const awayTeam = normalizeManualMatchNoteField(input.awayTeam, 'away team');
	const matchDate = normalizeManualMatchNoteField(input.matchDate, 'match date');
	const competition = normalizeManualMatchNoteField(input.competition, 'competition');
	const sourceUrl = normalizeOptionalMatchNoteSourceUrl(input.source?.sourceUrl);
	const title = `${homeTeam} vs ${awayTeam} ${matchDate}`;

	return {
		title,
		folder: destinationFolder,
		content: buildMatchNoteMarkdown({
			snapshotLines: buildManualMatchSnapshotLines({
				competition,
				homeTeam,
				matchDate,
				awayTeam,
				sourceUrl,
			}),
			sourceUrl,
		}),
	};
}

function buildMatchNoteMarkdown(options: {
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
	homeTeam: string;
	matchDate: string;
	awayTeam: string;
	sourceUrl?: string;
}): string[] {
	const lines = [
		`- Home team: ${formatWikiLink(input.homeTeam)}`,
		`- Away team: ${formatWikiLink(input.awayTeam)}`,
		`- Match date: ${input.matchDate}`,
		`- Competition: ${input.competition}`,
	];

	if (input.sourceUrl !== undefined && input.sourceUrl.length > 0) {
		lines.push(`- Source URL: ${input.sourceUrl}`);
	}

	return lines;
}

function formatWikiLink(value: string): string {
	return `[[${value}]]`;
}

function normalizeManualMatchNoteField(value: string, fieldName: string): string {
	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		throw new Error(`Manual match note ${fieldName} cannot be empty.`);
	}

	return trimmedValue;
}

function normalizeOptionalMatchNoteSourceUrl(value: string | undefined): string | undefined {
	const trimmedValue = value?.trim();

	return trimmedValue !== undefined && trimmedValue.length > 0 ? trimmedValue : undefined;
}
