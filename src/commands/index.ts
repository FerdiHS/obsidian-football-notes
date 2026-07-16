import type FootballNotesPlugin from '../main';
import { registerCreateMatchNoteManuallyCommand } from './create-match-note-manually';
import { registerCreateMatchNoteFromUrlCommand } from './create-match-note-from-url';

export function registerCommands(plugin: FootballNotesPlugin): void {
	registerCreateMatchNoteManuallyCommand(plugin);
	registerCreateMatchNoteFromUrlCommand(plugin);
}
