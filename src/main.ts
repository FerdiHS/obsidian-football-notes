import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { FootballNotesSettingTab } from './settings';
import { type FootballNotesSettings, hydrateLoadedSettings } from './settings-data';
import { normalizeMatchNotesFolder } from './types';

export default class FootballNotesPlugin extends Plugin {
	settings: FootballNotesSettings;

	async onload() {
		await this.loadSettings();
		registerCommands(this);
		this.addSettingTab(new FootballNotesSettingTab(this.app, this));
	}

	async loadSettings() {
		const loadedSettings = hydrateLoadedSettings(await this.loadData());

		this.settings = loadedSettings.settings;

		if (loadedSettings.shouldPersistNormalizedFolder) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		this.settings.notesFolder = normalizeMatchNotesFolder(this.settings.notesFolder);
		await this.saveData(this.settings);
	}
}
