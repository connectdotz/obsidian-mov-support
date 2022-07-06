import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
import { MovSupportSettings } from './types';

export const DEFAULT_SETTINGS: MovSupportSettings = {
	enableLivePreview: true,
	enablePreview: true,
};

export interface SettingChangeListener {
	onSettingChanged: (setting: MovSupportSettings) => void;
}

export class MovSupportSettingTab extends PluginSettingTab {
	plugin: Plugin & SettingChangeListener;
	setting: MovSupportSettings;

	constructor(
		app: App,
		initialValue: MovSupportSettings,
		plugin: Plugin & SettingChangeListener
	) {
		super(app, plugin);
		this.plugin = plugin;
		this.setting = { ...initialValue };
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'MOV Extension Settings' });

		new Setting(containerEl)
			.setName('enable LivePreview')
			.setDesc('show embedded .mov file in LivePreview mode')
			.addToggle((toggle) => {
				toggle
					.setTooltip('show embedded .mov file in LivePreview mode')
					.setValue(this.setting.enableLivePreview)
					.onChange((value) => {
						this.setting.enableLivePreview = value;
						this.plugin.onSettingChanged(this.setting);
					});
			});

		new Setting(containerEl)
			.setName('enable Preview')
			.setDesc('show embedded .mov file in Preview mode')
			.addToggle((toggle) => {
				toggle
					.setTooltip('show embedded .mov file in Preview mode')
					.setValue(this.setting.enablePreview)
					.onChange((value) => {
						this.setting.enablePreview = value;
						this.plugin.onSettingChanged(this.setting);
					});
			});
	}
}
