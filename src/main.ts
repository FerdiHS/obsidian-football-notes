import { Plugin } from 'obsidian';
import { registerCommands } from './commands';
import { FootballNotesSettingTab } from './settings';
import { type FootballNotesSettings, hydrateLoadedSettings } from './settings-data';
import {
	normalizeMatchNotesFolder,
	normalizePlayerNotesFolder,
	normalizeTeamNotesFolder,
} from './types';

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

		if (loadedSettings.shouldPersistNormalizedSettings) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		this.settings.notesFolder = normalizeMatchNotesFolder(this.settings.notesFolder);
		this.settings.teamNotesFolder = normalizeTeamNotesFolder(this.settings.teamNotesFolder);
		this.settings.playerNotesFolder = normalizePlayerNotesFolder(
			this.settings.playerNotesFolder,
		);
		await this.saveData(this.settings);
	}
}
