import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
	EmbedVideoContext,
	getFile,
	getFileSourcePath,
	OBSIDIAN_INTERNAL_EMBED_CLASS,
	replaceEmbedVideo,
	showPluginElements,
} from './helper';
import { MovSupportSettings, MovExtPluginContext, UnregisterListener } from './types';
import { editorEditorField, editorLivePreviewField } from 'obsidian';

const CLASS_NAME = 'mov-support-live-preview';
/**
 * editor extension to support livePreview for mov videos
 * @param pluginContext
 * @returns
 */
export const createEditorExtension = (pluginContext: MovExtPluginContext): Extension =>
	ViewPlugin.fromClass(
		class {
			private observer: MutationObserver;
			private vContext: EmbedVideoContext;
			private unregisterSettingListener: UnregisterListener;

			constructor(private view: EditorView) {
				this.vContext = {
					app: pluginContext.app,
					className: CLASS_NAME,
					sourcePath: getFileSourcePath(this.view),
				};
				this.observer = this.createMutationObserver(view);
				this.unregisterSettingListener = pluginContext.registerSettingsListener(
					this.onSettingsSaved.bind(this)
				);

				this.updateLivePreview();
			}

			updateLivePreview() {
				if (this.view.contentDOM) {
					replaceEmbedVideo(this.view.contentDOM, this.vContext);
				}
			}
			onSettingsSaved(oldSettings: MovSupportSettings) {
				if (pluginContext.settings.enableLivePreview === oldSettings.enableLivePreview) {
					return;
				}

				if (showPluginElements(CLASS_NAME, pluginContext.settings.enableLivePreview) <= 0) {
					if (pluginContext.settings.enableLivePreview && this.isLivePreview()) {
						this.updateLivePreview();
					}
				}
			}

			isLivePreview(): boolean {
				return this.view.state.field(editorLivePreviewField);
			}
			getEditor(): EditorView {
				return this.view.state.field(editorEditorField);
			}
			createMutationObserver(view: EditorView) {
				const targetNode = view.contentDOM;

				// Options for the observer (which mutations to observe)
				const config = {
					attributes: true,
					childList: true,
					subtree: true,
					attributeFilter: [OBSIDIAN_INTERNAL_EMBED_CLASS],
				};

				// Callback function to execute when mutations are observed
				const callback: MutationCallback = (mutationList) => {
					if (!pluginContext.settings.enableLivePreview) {
						return;
					}

					for (const mutation of mutationList) {
						if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
							for (let node of mutation.addedNodes) {
								replaceEmbedVideo(node as HTMLElement, this.vContext);
							}
						}
					}
				};

				// Create an observer instance linked to the callback function
				const observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(targetNode, config);
				console.log(
					`<editorExtension.createMutationObserver> dom mutation observer starts to observe ${
						getFile(this.view)?.name
					}`
				);

				return observer;
			}

			destroy() {
				this.unregisterSettingListener();
				this.observer.disconnect();
				console.log(
					`<editorExtension.destory> dom mutation observer is disconnected: ${
						getFile(this.view)?.name
					}`
				);
			}
		}
	);
