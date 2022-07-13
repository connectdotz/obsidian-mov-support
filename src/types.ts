import { App } from 'obsidian';

export interface MovSupportSettings {
	enableLivePreview: boolean;
	enablePreview: boolean;
}
export type UnregisterListener = () => void;
export interface MovExtPluginContext {
	readonly app: App;
	readonly settings: MovSupportSettings;
	registerSettingsListener: (f: OnSettingsSaved) => UnregisterListener;
	isDebug: boolean;
}

export type OnSettingsSaved = (oldSettings: MovSupportSettings) => void;
