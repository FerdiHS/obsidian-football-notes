import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, FootballNotesSettings, FootballNotesSettingTab} from './settings';

export default class FootballNotesPlugin extends Plugin {
	settings: FootballNotesSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new FootballNotesSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<FootballNotesSettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
