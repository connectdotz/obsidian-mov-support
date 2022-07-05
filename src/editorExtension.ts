import { EditorView, ViewPlugin } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import {
	getFileSourcePath,
	showPluginElements,
	traverseElement,
	VideoHelper,
	videoHelper,
} from './helper';
import { MovSupportSettings, MovExtPluginContext } from './types';
import { Editor, editorEditorField, editorLivePreviewField } from 'obsidian';

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
			private _helper: VideoHelper | undefined;

			constructor(private view: EditorView) {
				this.observer = this.createMutationObserver(view);

				pluginContext.registerSettingsListener(this.onSettingsSaved.bind(this));
			}
			get helper() {
				if (!this._helper) {
					const sPath = getFileSourcePath(this.view);
					if (sPath) {
						this._helper = videoHelper(app, sPath, CLASS_NAME);
					}
				}
				return this._helper;
			}

			onSettingsSaved(oldSettings: MovSupportSettings) {
				if (pluginContext.settings.enableLivePreview === oldSettings.enableLivePreview) {
					return;
				}

				if (showPluginElements(CLASS_NAME, pluginContext.settings.enableLivePreview) <= 0) {
					if (pluginContext.settings.enableLivePreview && this.isLivePreview()) {
						console.log(
							`<EditorExtension.onSettingsSaved> search and replace video for LivePreview`
						);
						this.helper.replaceEmbedVideo(this.view.contentDOM);
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
					attributeFilter: ['internal-embed'],
				};

				// Callback function to execute when mutations are observed
				const callback: MutationCallback = (mutationList) => {
					if (!pluginContext.settings.enableLivePreview) {
						console.log(`<mutationObserver> disabled by settings`);
						return;
					}
					if (!this.helper) {
						console.log(
							`<mutationObserver> abort, obsidian/cm state is not set up yet`
						);
						return;
					}
					// Use traditional 'for loops' for IE 11
					for (const mutation of mutationList) {
						if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
							for (let node of mutation.addedNodes) {
								this.helper.replaceEmbedVideo(node as HTMLElement);
							}
						}
					}
				};

				// Create an observer instance linked to the callback function
				const observer = new MutationObserver(callback);

				// Start observing the target node for configured mutations
				observer.observe(targetNode, config);
				console.log(
					`<editorExtension.createMutationObserver> dom mutation observer starts to observe`
				);

				return observer;
			}

			destroy() {
				this.observer.disconnect();
				console.log(`<editorExtension.destory> dom mutation observer is disconnected`);
			}
		}
	);
