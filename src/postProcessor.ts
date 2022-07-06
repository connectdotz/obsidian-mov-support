import * as CodeMirror from 'codemirror';
import { MarkdownPostProcessor, MarkdownView } from 'obsidian';
import {
	EmbedVideoContext,
	onMovEmbedElement,
	replaceEmbedVideo,
	replaceVideoChild,
	showPluginElements,
} from './helper';
import { MovSupportSettings, MovExtPluginContext } from './types';

const CLASS_NAME = 'mov-support-preview';

export const createMarkdownPostProcessor = (
	pluginContext: MovExtPluginContext
): MarkdownPostProcessor => {
	const vContext: EmbedVideoContext = {
		app: pluginContext.app,
		className: CLASS_NAME,
		sourcePath: '',
	};
	// update all previews in the workspace
	const updatePreviews = () => {
		const leaves = app.workspace.getLeavesOfType('markdown');
		const localContext = { ...vContext };
		leaves.forEach((l) => {
			const mView = l.view as MarkdownView;
			if (mView.getMode() === 'preview' && mView.contentEl) {
				localContext.sourcePath = mView.file.path;
				replaceEmbedVideo(mView.contentEl, localContext);
			}
		});
	};
	const onSettingsSaved = (oldSettings: MovSupportSettings) => {
		if (pluginContext.settings.enablePreview === oldSettings.enablePreview) {
			return;
		}

		if (showPluginElements(CLASS_NAME, pluginContext.settings.enablePreview) <= 0) {
			if (pluginContext.settings.enablePreview) {
				updatePreviews();
			}
		}
	};

	/**
	 * add a `"type": "video/mp4"` attribute for mov embed elements found within. These elements might be altered in other post-process,
	 * which need to be monitored with an event listener. Also take care of the clean up.
	 * @param element
	 */

	const postProcessor: MarkdownPostProcessor = (element, context) => {
		if (!pluginContext.settings.enablePreview) {
			return;
		}

		const localContext = { ...vContext, sourcePath: context.sourcePath };
		onMovEmbedElement(element, (e: HTMLElement) => {
			// monitor the future "mov" elements
			e.onNodeInserted(() => replaceVideoChild(e, localContext), true);
		});
	};

	pluginContext.registerSettingsListener(onSettingsSaved);
	updatePreviews();

	return postProcessor;
};
