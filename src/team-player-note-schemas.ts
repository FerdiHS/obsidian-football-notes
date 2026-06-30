export interface NoteSchemaContract {
	frontmatter: {
		required: readonly string[];
		optional: readonly string[];
	};
	bodySections: readonly string[];
}

export const TEAM_NOTE_SCHEMA = {
	frontmatter: {
		required: ['type', 'sport', 'team_name'] as const,
		optional: ['country', 'league', 'aliases', 'tags'] as const,
	},
	bodySections: ['# Team Name', '## Overview', '## Matches', '## Players', '## Notes'] as const,
} satisfies NoteSchemaContract;

export const PLAYER_NOTE_SCHEMA = {
	frontmatter: {
		required: ['type', 'sport', 'player_name'] as const,
		optional: ['team', 'position', 'country', 'aliases', 'tags'] as const,
	},
	bodySections: ['# Player Name', '## Overview', '## Teams', '## Matches', '## Notes'] as const,
} satisfies NoteSchemaContract;
