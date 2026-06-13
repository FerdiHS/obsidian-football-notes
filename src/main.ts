import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, FootballNotesSettings, FootballNotesSettingTab } from './settings';
import { normalizeMatchNotesFolder } from './types';

export default class FootballNotesPlugin extends Plugin {
	settings: FootballNotesSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FootballNotesSettingTab(this.app, this));
	}

	async loadSettings() {
		const loadedSettings = (await this.loadData()) as Partial<FootballNotesSettings>;
		const notesFolder = normalizeMatchNotesFolder(
			loadedSettings?.notesFolder ?? DEFAULT_SETTINGS.notesFolder,
		);
		const shouldPersistNormalizedFolder =
			loadedSettings?.notesFolder !== undefined && loadedSettings.notesFolder !== notesFolder;

		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings, {
			notesFolder,
		});

		if (shouldPersistNormalizedFolder) {
			await this.saveSettings();
		}
	}

	async saveSettings() {
		this.settings.notesFolder = normalizeMatchNotesFolder(this.settings.notesFolder);
		await this.saveData(this.settings);
	}
}
