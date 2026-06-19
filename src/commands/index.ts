import type FootballNotesPlugin from '../main';
import { registerCreateMatchNoteFromUrlCommand } from './create-match-note-from-url';

export function registerCommands(plugin: FootballNotesPlugin): void {
	registerCreateMatchNoteFromUrlCommand(plugin);
}
