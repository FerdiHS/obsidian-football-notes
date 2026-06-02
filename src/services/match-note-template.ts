import { normalizeMatchNotesFolder } from '../types';
import type { MatchNoteDraft, MatchNoteInput } from '../types';

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
	const sourceUrl = input.sourceUrl.trim();

	return {
		title: 'New match note',
		folder: destinationFolder,
		content: buildMatchNoteMarkdown(sourceUrl),
	};
}

function buildMatchNoteMarkdown(sourceUrl: string): string {
	const sectionHeadings = MATCH_NOTE_SECTIONS.flatMap((section) => [`## ${section}`, '']);

	return [
		'---',
		`type: ${MATCH_NOTE_FRONTMATTER.type}`,
		`sport: ${MATCH_NOTE_FRONTMATTER.sport}`,
		`${MATCH_NOTE_FRONTMATTER.sourceUrlKey}: ${formatFrontmatterString(sourceUrl)}`,
		'---',
		'',
		'# Match',
		'',
		...sectionHeadings,
	].join('\n');
}

function formatFrontmatterString(value: string): string {
	return JSON.stringify(value);
}
