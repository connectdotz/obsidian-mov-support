import { addIcon, App, Editor, MarkdownView, Plugin, TFile } from 'obsidian';
import { createEditorExtension } from './editorExtension';
import { createMarkdownPostProcessor } from './postProcessor';
import { DEFAULT_SETTINGS, MovSupportSettingTab, SettingChangeListener } from './settings';
import { MovExtPluginContext, MovSupportSettings, OnSettingsSaved } from './types';

export default class MovSupportPlugin
	extends Plugin
	implements SettingChangeListener, MovExtPluginContext
{
	settings: MovSupportSettings;
	private settingsListeners: Set<OnSettingsSaved> = new Set();

	async onload() {
		await this.loadSettings();
		this.setupLivePreview();
		this.setupPreview();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (this.settings.enableLivePreview || this.settings.enablePreview) {
			const statusBarItemEl = this.addStatusBarItem();
			statusBarItemEl.setText('mov:supported');
		}

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MovSupportSettingTab(this.app, this.settings, this));
	}
	setupLivePreview() {
		this.registerEditorExtension(createEditorExtension(this));
	}
	setupPreview() {
		// markdown rendering
		this.registerMarkdownPostProcessor(createMarkdownPostProcessor(this));
	}
	registerSettingsListener(listener: OnSettingsSaved): () => void {
		this.settingsListeners.add(listener);
		return () => {
			this.settingsListeners.delete(listener);
		};
	}

	onSettingChanged(setting: MovSupportSettings) {
		const prev = { ...this.settings };
		this.settings = { ...setting };
		this.saveSettings().then(() => {
			this.settingsListeners.forEach((f) => f(prev));
		});
	}
	onunload() {
		const prev = { ...this.settings };
		this.settings.enableLivePreview = false;
		this.settings.enablePreview = false;

		this.settingsListeners.forEach((f) => f(prev));

		console.log(`<MovSupportPlugin> unloaded`);
	}

	async loadSettings() {
		const existing = await this.loadData();
		this.settings = Object.assign({}, DEFAULT_SETTINGS, existing);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
