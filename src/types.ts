import { App } from 'obsidian';

export interface MovSupportSettings {
	enableLivePreview: boolean;
	enablePreview: boolean;
	enableExtensionRename: boolean;
}
export interface MovExtPluginContext {
	readonly app: App;
	readonly settings: MovSupportSettings;
	registerSettingsListener: (f: OnSettingsSaved) => void;
	unregisterSettingsListener: (f: OnSettingsSaved) => void;
}

export type OnSettingsSaved = (oldSettings: MovSupportSettings) => void;
