import type FootballNotesPlugin from '../main';
import { registerCreatePlayerNoteCommand } from './create-player-note';
import { registerCreateTeamNoteCommand } from './create-team-note';
import { registerCreateMatchNoteManuallyCommand } from './create-match-note-manually';
import { registerCreateMatchNoteFromUrlCommand } from './create-match-note-from-url';

export function registerCommands(plugin: FootballNotesPlugin): void {
	registerCreateTeamNoteCommand(plugin);
	registerCreatePlayerNoteCommand(plugin);
	registerCreateMatchNoteManuallyCommand(plugin);
	registerCreateMatchNoteFromUrlCommand(plugin);
}
