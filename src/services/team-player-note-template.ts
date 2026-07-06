import {
	normalizePlayerNotesFolder,
	normalizeTeamNotesFolder,
	type PlayerNoteInput,
	type TeamNoteInput,
} from '../types';
import { sanitizeNoteTitle } from './note-title';
import type { NoteDraft } from './note-files';

const TEAM_NOTE_FRONTMATTER = {
	type: 'team-note',
	sport: 'football',
	nameKey: 'team_name',
} as const;

const PLAYER_NOTE_FRONTMATTER = {
	type: 'player-note',
	sport: 'football',
	nameKey: 'player_name',
} as const;

const TEAM_NOTE_BODY_SECTIONS = [
	'# Team Name',
	'## Overview',
	'## Matches',
	'## Players',
	'## Notes',
] as const;

const PLAYER_NOTE_BODY_SECTIONS = [
	'# Player Name',
	'## Overview',
	'## Teams',
	'## Matches',
	'## Notes',
] as const;

export function createTeamNoteDraft(input: TeamNoteInput): NoteDraft {
	const destinationFolder = normalizeTeamNotesFolder(input.destinationFolder);
	const teamName = normalizeNamedNoteName(input.name, 'team');

	return {
		title: teamName.fileTitle,
		folder: destinationFolder,
		content: buildNoteMarkdown({
			frontmatterLines: [
				`type: ${TEAM_NOTE_FRONTMATTER.type}`,
				`sport: ${TEAM_NOTE_FRONTMATTER.sport}`,
				`${TEAM_NOTE_FRONTMATTER.nameKey}: ${formatFrontmatterString(teamName.displayName)}`,
			],
			bodySections: TEAM_NOTE_BODY_SECTIONS,
		}),
	};
}

export function createPlayerNoteDraft(input: PlayerNoteInput): NoteDraft {
	const destinationFolder = normalizePlayerNotesFolder(input.destinationFolder);
	const playerName = normalizeNamedNoteName(input.name, 'player');

	return {
		title: playerName.fileTitle,
		folder: destinationFolder,
		content: buildNoteMarkdown({
			frontmatterLines: [
				`type: ${PLAYER_NOTE_FRONTMATTER.type}`,
				`sport: ${PLAYER_NOTE_FRONTMATTER.sport}`,
				`${PLAYER_NOTE_FRONTMATTER.nameKey}: ${formatFrontmatterString(playerName.displayName)}`,
			],
			bodySections: PLAYER_NOTE_BODY_SECTIONS,
		}),
	};
}

function buildNoteMarkdown(input: {
	frontmatterLines: readonly string[];
	bodySections: readonly string[];
}): string {
	const sections: string[] = [];

	for (const section of input.bodySections) {
		sections.push(section, '');
	}

	return ['---', ...input.frontmatterLines, '---', '', ...sections].join('\n');
}

function formatFrontmatterString(value: string): string {
	return JSON.stringify(value);
}

function normalizeNamedNoteName(
	value: string,
	noteKind: 'team' | 'player',
): {
	displayName: string;
	fileTitle: string;
} {
	const displayName = value.trim();

	if (displayName.length === 0) {
		throw new Error(`Manual ${noteKind} note name cannot be empty.`);
	}

	const fileTitle = sanitizeNoteTitle(displayName);

	if (fileTitle.length === 0) {
		throw new Error(`Manual ${noteKind} note name cannot be empty.`);
	}

	return {
		displayName,
		fileTitle,
	};
}
