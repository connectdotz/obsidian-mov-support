import { addIcon, App, Editor, MarkdownView, Plugin, TFile } from 'obsidian';
import { RenameHelper, movRenameHelper } from './rename';
import { createEditorExtension } from './editorExtension';
import { createMarkdownPostProcessor } from './postProcessor';
import { DEFAULT_SETTINGS, MovSupportSettingTab, SettingChangeListener } from './settings';
import { MovExtPluginContext, MovSupportSettings, OnSettingsSaved } from './types';

export default class MovSupportPlugin
	extends Plugin
	implements SettingChangeListener, MovExtPluginContext
{
	settings: MovSupportSettings;
	private rename: RenameHelper;
	private ribbonIconEl?: HTMLElement;
	private settingsListeners: Set<OnSettingsSaved> = new Set();

	async onload() {
		await this.loadSettings();
		this.setupRename();
		this.setupLivePreview();
		this.setupPreview();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		if (
			this.settings.enableExtensionRename ||
			this.settings.enableLivePreview ||
			this.settings.enablePreview
		) {
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
	setupRename() {
		if (!this.settings.enableExtensionRename) {
			return;
		}
		this.rename = movRenameHelper(this);

		// addIcon("rename", `width="16px" height="16px" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 1h13l.5.5v13l-.5.5h-13l-.5-.5v-13l.5-.5zM2 14h12V2H2v12zm2-5h3v3l5-4-5-4v3H4v2z"`);
		addIcon(
			'rename',
			`<path fill="currentColor" d="M 9.375 6.25 L 90.625 6.25 L 93.75 9.375 L 93.75 90.625 L 90.625 93.75 L 9.375 93.75 L 6.25 90.625 L 6.25 9.375 Z M 12.5 87.5 L 87.5 87.5 L 87.5 12.5 L 12.5 12.5 Z M 25 56.25 L 43.75 56.25 L 43.75 75 L 75 50 L 43.75 25 L 43.75 43.75 L 25 43.75 Z M 25 56.25" />`
		);

		// This creates an icon in the left ribbon.
		this.ribbonIconEl = this.addRibbonIcon(
			'rename',
			'Rename all .mov to .mp4',
			(evt: MouseEvent) => {
				if (this.settings.enableExtensionRename) {
					this.rename.all();
				}
			}
		);
		// file-menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file) => {
				if (
					!this.settings.enableExtensionRename ||
					!(file instanceof TFile) ||
					file.extension?.toLowerCase() !== 'mov'
				) {
					return;
				}
				menu.addItem((item) => {
					item.setTitle('rename to .mp4')
						.setIcon('rename')
						.onClick(async () => {
							this.rename.attachment(file);
						});
				});
			})
		);

		// editor-menu rename current file links
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				if (!this.settings.enableExtensionRename) {
					return;
				}
				menu.addItem((item) => {
					item.setTitle('Rename .mov links to .mp4')
						.setIcon('rename')
						.onClick(async () => {
							this.rename.inFile(view.file);
						});
				});
			})
		);

		//TODO: how do we remove commands?
		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'mov-support-rename-all',
			name: 'Rename all .mov to .mp4',
			callback: () => {
				this.rename.all();
			},
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'mov-support-rename-in-file',
			name: 'Rename all .mov links in current file',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.rename.inFile(view.file);
			},
		});
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
			if (prev.enableExtensionRename !== this.settings.enableExtensionRename) {
				this.ribbonIconEl?.toggle(this.settings.enableExtensionRename);
			}

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
