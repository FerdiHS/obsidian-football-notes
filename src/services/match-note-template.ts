import type {MatchNoteDraft, MatchNoteInput} from '../types';

export function createMatchNoteDraft(input: MatchNoteInput): MatchNoteDraft {
	const destinationFolder = input.destinationFolder.trim() || 'Football notes/matches';
	const sourceUrl = input.sourceUrl.trim();

	return {
		title: 'New match note',
		folder: destinationFolder,
		content: buildMatchNoteMarkdown(sourceUrl),
	};
}

function buildMatchNoteMarkdown(sourceUrl: string): string {
	return [
		'---',
		'type: match-note',
		'status: draft',
		`source: ${formatFrontmatterString(sourceUrl)}`,
		'---',
		'',
		'# Match',
		'',
		'## Summary',
		'',
		'## Match details',
		'',
		'## Lineups',
		'',
		'## Timeline',
		'',
		'## Notes',
		'',
	].join('\n');
}

function formatFrontmatterString(value: string): string {
	return JSON.stringify(value);
}
