import { App, PluginSettingTab, Setting } from 'obsidian';
import type FootballNotesPlugin from './main';
import {
	DEFAULT_MATCH_NOTES_FOLDER,
	DEFAULT_PLAYER_NOTES_FOLDER,
	DEFAULT_TEAM_NOTES_FOLDER,
	normalizeMatchNotesFolder,
	normalizePlayerNotesFolder,
	normalizeTeamNotesFolder,
} from './types';

export class FootballNotesSettingTab extends PluginSettingTab {
	plugin: FootballNotesPlugin;

	constructor(app: App, plugin: FootballNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		addFolderSetting(containerEl, {
			name: 'Match notes folder',
			description: 'Folder where generated match notes should be created.',
			placeholder: DEFAULT_MATCH_NOTES_FOLDER,
			value: this.plugin.settings.notesFolder,
			onChange: async (value) => {
				this.plugin.settings.notesFolder = normalizeMatchNotesFolder(value);
				await this.plugin.saveSettings();
			},
		});

		addFolderSetting(containerEl, {
			name: 'Team notes folder',
			description: 'Folder where generated team notes should be created.',
			placeholder: DEFAULT_TEAM_NOTES_FOLDER,
			value: this.plugin.settings.teamNotesFolder,
			onChange: async (value) => {
				this.plugin.settings.teamNotesFolder = normalizeTeamNotesFolder(value);
				await this.plugin.saveSettings();
			},
		});

		addFolderSetting(containerEl, {
			name: 'Player notes folder',
			description: 'Folder where generated player notes should be created.',
			placeholder: DEFAULT_PLAYER_NOTES_FOLDER,
			value: this.plugin.settings.playerNotesFolder,
			onChange: async (value) => {
				this.plugin.settings.playerNotesFolder = normalizePlayerNotesFolder(value);
				await this.plugin.saveSettings();
			},
		});
	}
}

interface FolderSettingOptions {
	name: string;
	description: string;
	placeholder: string;
	value: string;
	onChange: (value: string) => Promise<void>;
}

function addFolderSetting(containerEl: HTMLElement, options: FolderSettingOptions): void {
	new Setting(containerEl)
		.setName(options.name)
		.setDesc(options.description)
		.addText((text) =>
			text
				.setPlaceholder(options.placeholder)
				.setValue(options.value)
				.onChange(options.onChange),
		);
}
