import * as CodeMirror from 'codemirror';
import { MarkdownPostProcessor, MarkdownView } from 'obsidian';

import {
	EmbedVideoContext,
	logger,
	onMovEmbedElement,
	replaceEmbedVideo,
	replaceVideoChild,
	togglePluginElements,
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
	const log = logger('postProcessor', pluginContext.isDebug);
	const previewEl = (mView: MarkdownView): HTMLElement | undefined =>
		mView.previewMode?.containerEl ?? (mView.getMode() === 'preview' && mView.contentEl);
	const forEachMarkdownView = (callBack: (mView: MarkdownView) => void) => {
		const leaves = app.workspace.getLeavesOfType('markdown');
		leaves.forEach((l) => {
			const mView = l.view as MarkdownView;
			if (mView.containerEl) {
				callBack(mView);
			}
		});
	};
	// update all previews in the workspace
	const updatePreviews = () => {
		forEachMarkdownView(updatePreview);
	};
	const updatePreview = (mView?: MarkdownView): void => {
		replaceEmbedVideo(previewEl(mView), { ...vContext, sourcePath: mView.file.path });
	};
	const onSettingsSaved = (oldSettings: MovSupportSettings) => {
		if (pluginContext.settings.enablePreview === oldSettings.enablePreview) {
			return;
		}

		forEachMarkdownView((mView: MarkdownView) => {
			if (
				togglePluginElements(
					previewEl(mView),
					CLASS_NAME,
					pluginContext.settings.enablePreview
				) <= 0
			) {
				if (pluginContext.settings.enablePreview) {
					updatePreview(mView);
				}
			}
		});
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
