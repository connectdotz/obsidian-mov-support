import * as CodeMirror from 'codemirror';
import { MarkdownPostProcessor, MarkdownView } from 'obsidian';
import { onMovEmbedElement, showPluginElements, videoHelper } from './helper';
import { MovSupportSettings, MovExtPluginContext } from './types';

const CLASS_NAME = 'mov-support-preview';

export const createMarkdownPostProcessor = (
	pluginContext: MovExtPluginContext
): MarkdownPostProcessor => {
	const onSettingsSaved = (oldSettings: MovSupportSettings) => {
		if (pluginContext.settings.enablePreview === oldSettings.enablePreview) {
			return;
		}

		if (showPluginElements(CLASS_NAME, pluginContext.settings.enablePreview) <= 0) {
			if (pluginContext.settings.enablePreview) {
				const leaves = app.workspace.getLeavesOfType('markdown');
				leaves.forEach((l) => {
					const mView = l.view as MarkdownView;
					if (mView.getMode() === 'preview') {
						console.log(
							`<MarkdownPostProcessor.onSettingsSaved> search and replace video for preview:`,
							mView.contentEl
						);
						const vHelper = videoHelper(pluginContext.app, mView.file.path, CLASS_NAME);
						vHelper.replaceEmbedVideo(mView.contentEl);
					}
				});
			}
		}
	};

	pluginContext.registerSettingsListener(onSettingsSaved);

	/**
	 * add a `"type": "video/mp4"` attribute for mov embed elements found within. These elements might be altered in other post-process,
	 * which need to be monitored with an event listener. Also take care of the clean up.
	 * @param element
	 */

	const postProcessor: MarkdownPostProcessor = (element, context) => {
		if (!pluginContext.settings.enablePreview) {
			console.log(`<handleMoeEmbed> disabled by settings`);
			return;
		}

		const helper = videoHelper(pluginContext.app, context.sourcePath, CLASS_NAME);
		onMovEmbedElement(element, (e: HTMLElement) => {
			// monitor the future "mov" elements
			e.onNodeInserted(() => helper.replaceVideoChild(e), true);
		});
	};

	return postProcessor;
};
