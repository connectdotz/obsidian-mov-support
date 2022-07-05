import { EditorView } from '@codemirror/view';
import { App, editorViewField } from 'obsidian';

export const traverseElement = (
	element: HTMLElement,
	onElement: (e: HTMLElement) => void
): void => {
	onElement(element);
	for (let child of element.children) {
		traverseElement(child as HTMLElement, onElement);
	}
};

export const getFileSourcePath = (cmView: EditorView): string | undefined => {
	const mdView = cmView.state.field(editorViewField);
	return mdView?.file?.path;
};

const NO_HOVER_CLASS = 'noHover';
const ORIGINAL_VIDEO_ARIAL_LABEL = 'Open in default app';

/**
 * change element's visibility by class
 * @param className
 * @param show
 * @param element
 * @returns number of elements changed
 */
export const showPluginElements = (
	className: string,
	show: boolean,
	element?: HTMLElement
): number => {
	const elements = (element ?? document.body).getElementsByClassName(className);
	console.log(
		`<showPluginElements> ${show ? 'show' : 'hide'} ${elements.length} ${className} elements:`,
		elements
	);
	for (const e of elements) {
		(e as HTMLElement).toggle(show);
		(e.previousElementSibling as HTMLElement)?.toggle(!show);
		(e.parentElement as HTMLElement)?.toggleClass(NO_HOVER_CLASS, show);
		if (show) {
			e.parentElement.setAttribute('aria-label', '');
		} else {
			e.parentElement.setAttribute('aria-label', ORIGINAL_VIDEO_ARIAL_LABEL);
		}
	}
	return elements.length;
};

export const onMovEmbedElement = (head: HTMLElement, handler: (e: HTMLElement) => void): void => {
	const embedElements = head.getElementsByClassName('internal-embed');
	if (embedElements.length <= 0) {
		return;
	}
	const matched: HTMLElement[] = [];
	for (let e of embedElements) {
		const vSource = e.getAttribute('src');
		if (vSource?.toLowerCase().endsWith('.mov')) {
			handler(e as HTMLElement);
		}
	}
};
export const videoHelper = (app: App, sourcePath: string, className: string) => {
	const getLinkPath = (link: string): string | undefined => {
		const f = app.metadataCache.getFirstLinkpathDest(link, sourcePath);
		const p = app.vault.getResourcePath(f);
		return p;
	};

	const createVideo = (parent: Element, linkSrc: string): HTMLVideoElement | undefined => {
		const absolutePath = getLinkPath(linkSrc);
		if (absolutePath) {
			const video = parent.createEl('video', { cls: className });
			video.setAttribute('controls', 'true');
			video.setAttribute('preload', 'metadata');
			video.setAttribute('playsinline', 'true');
			video.setAttribute('src', `${absolutePath}#t=0.001`);
			video.setAttribute('type', 'video/mp4');

			video.onClickEvent((event) => {
				event.preventDefault();
				event.stopPropagation();

				video.paused ? video.play() : video.pause();
			});
			return video;
		} else {
			console.error(
				`<videoHelper.createVideo> failed to retrieve absolute path for resource: ${linkSrc}`
			);
		}
	};

	// when failed-embed-video element inserted to parent element, we replace it with an actual <video> element
	const replaceVideoChild = (parent: HTMLElement, videoSrc?: string) => {
		const vSource = videoSrc || parent.getAttribute('src');
		console.log(
			`<videoHelper.replaceVideoChild> replace child with video for ${vSource}:`,
			parent
		);
		if (!vSource) {
			console.error('<videoHelper.replaceVideoChild> no video src found');
			throw new Error(`no video src found for embed element: ${parent.toString()}`);
		}
		// for mov file, we expect no video element be generated as it is not a supported media file format
		if (parent.children.length === 1) {
			//replace the div with video element
			const video = createVideo(parent, vSource);
			if (video) {
				//disable parent hovering
				parent.toggleClass(NO_HOVER_CLASS, true);
				parent.setAttribute('aria-label', '');

				// mark and hide the existing child
				const original = parent.children[0] as HTMLElement;
				original.toggle(false);

				// append the new video child element
				parent.appendChild(video);
				console.log(
					`<videoHelper.replaceVideoChild> replace mov with new video`,
					video,
					`, e=`,
					parent
				);
			} else {
				console.error(`<videoHelper.replaceVideoChild> failed to replace child with video`);
				throw new Error('failed to replace child with video');
			}
		}
	};

	/**
	 * find any internal embed node within the element, then add a proper mov video element accordingly
	 * @param embedElement The parent element marked as 'internal-embed' node.
	 * @return the number of elements converted
	 */
	const replaceEmbedVideo = (element: HTMLElement): void => {
		onMovEmbedElement(element, (e) => {
			replaceVideoChild(e);
		});
	};
	/**
	 * find the target view from worksplace and handle all matched embed mov elements
	 * @param filter
	 */
	// const replaceVideoForView = (filter: (view: MarkdownView) => boolean) => {
	// 	const leaves = app.workspace.getLeavesOfType('markdown');
	// 	leaves.forEach((l) => {
	// 		const mView = l.view as MarkdownView;
	// 		if (filter(mView)) {
	// 			replaceEmbedVideo(mView.containerEl);
	// 		}
	// 	});
	// };

	return { replaceEmbedVideo, replaceVideoChild };
};
export type VideoHelper = ReturnType<typeof videoHelper>;
