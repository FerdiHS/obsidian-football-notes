import {App, PluginSettingTab, Setting} from "obsidian";
import type FootballNotesPlugin from "./main";

export interface FootballNotesSettings {
	notesFolder: string;
}

export const DEFAULT_SETTINGS: FootballNotesSettings = {
	notesFolder: 'Football notes/matches'
};

export class FootballNotesSettingTab extends PluginSettingTab {
	plugin: FootballNotesPlugin;

	constructor(app: App, plugin: FootballNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Match notes folder')
			.setDesc('Folder where generated match notes should be created.')
			.addText(text => text
				.setPlaceholder('Football notes/matches')
				.setValue(this.plugin.settings.notesFolder)
				.onChange(async (value) => {
					this.plugin.settings.notesFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
