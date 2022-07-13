import { EditorView } from '@codemirror/view';
import { App, editorViewField, TFile } from 'obsidian';

export const getFile = (cmView: EditorView): TFile | undefined => {
	const mdView = cmView.state.field(editorViewField);
	return mdView?.file;
};
export const getFileSourcePath = (cmView: EditorView): string | undefined => getFile(cmView)?.path;

const NO_HOVER_CLASS = 'noHover';
const ORIGINAL_VIDEO_ARIAL_LABEL = 'Open in default app';
export const OBSIDIAN_INTERNAL_EMBED_CLASS = 'internal-embed';

export const logger = (prefix: string, isDebug: boolean) => {
	const label = `[MOVSupport/${prefix}]: `;
	const debug = (...args: any[]) => (isDebug ? console.log(label, ...args) : {});
	const warn = (...args: any[]) => console.warn(label, ...args);
	const error = (...args: any[]) => console.error(label, ...args);

	return { debug, warn, error };
};
const log = logger('helper', false);

const getHTMLElementsByClass = (element: HTMLElement, className: string): HTMLElement[] => {
	const found: HTMLElement[] = [];
	if (!element) {
		return found;
	}
	try {
		if (element.hasClass(className)) {
			found.push(element);
		}
		found.push(...(element.getElementsByClassName(className) as HTMLCollectionOf<HTMLElement>));
		return found;
	} catch (e) {
		log.error(`<MovSupport.getHTMLElementsByClass> failed:`, e, `, element=`, element);
		return [];
	}
};
/**
 * change element's visibility by class
 * @param className
 * @param show
 * @param element
 * @returns number of elements changed
 */
export const togglePluginElements = (
	element: HTMLElement,
	className: string,
	show: boolean
): number => {
	const elements = getHTMLElementsByClass(element, className);
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
	if (!head) {
		return;
	}
	const embed = getHTMLElementsByClass(head, OBSIDIAN_INTERNAL_EMBED_CLASS);
	for (let e of embed) {
		const vSource = e.getAttribute('src');
		if (vSource?.toLowerCase().endsWith('.mov')) {
			handler(e as HTMLElement);
		}
	}
};

export interface EmbedVideoContext {
	app: App;
	sourcePath: string;
	className: string;
}

// export const videoHelper = (app: App, sourcePath: string, className: string) => {
const getLinkPath = (link: string, sourcePath: string): string | undefined => {
	const f = app.metadataCache.getFirstLinkpathDest(link, sourcePath);
	const p = app.vault.getResourcePath(f);
	return p;
};

const createVideo = (
	parent: Element,
	linkSrc: string,
	context: EmbedVideoContext
): HTMLVideoElement | undefined => {
	const absolutePath = getLinkPath(linkSrc, context.sourcePath);
	if (absolutePath) {
		const video = parent.createEl('video', { cls: context.className });
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
		log.error(`<createVideo> failed to retrieve absolute path for resource: ${linkSrc}`);
	}
};

/**
 * replace qualified mov embed element with new video element. If the video element already existed, ensure to turn it on. Return false if no action is taken.
 * @param parent
 * @param context
 * @param videoSrc
 * @returns true if replace occurred, otherwise false.
 */
export const replaceVideoChild = (
	parent: HTMLElement,
	context: EmbedVideoContext,
	videoSrc?: string
): boolean => {
	if (!parent) {
		return false;
	}
	const vSource = videoSrc || parent.getAttribute('src');
	if (!vSource) {
		console.error('<videoHelper.replaceVideoChild> no video src found');
		throw new Error(`no video src found for embed element: ${parent.toString()}`);
	}
	// for mov file, we expect no video element be generated as it is not a supported media file format
	if (parent.children.length === 1) {
		//replace the div with video element
		const video = createVideo(parent, vSource, context);
		if (video) {
			//disable parent hovering
			parent.toggleClass(NO_HOVER_CLASS, true);
			parent.setAttribute('aria-label', '');

			// mark and hide the existing child
			const original = parent.children[0] as HTMLElement;
			original.toggle(false);

			// append the new video child element
			parent.appendChild(video);
			return true;
		} else {
			console.error(`<videoHelper.replaceVideoChild> failed to replace child with video`);
			throw new Error('failed to replace child with video');
		}
	} else {
		// it's possible the video element already exist but is in the "off" mode, turn it on in that case
		if (togglePluginElements(parent, context.className, true) > 0) {
			return true;
		}
	}
	return false;
};

/**
 * find any internal embed node within the element, then add a proper mov video element accordingly
 * @param embedElement The parent element marked as 'internal-embed' node.
 * @return the number of video elements replaced
 */
export const replaceEmbedVideo = (
	element: HTMLElement | undefined,
	context: EmbedVideoContext
): number => {
	if (!element) {
		return;
	}

	let count = 0;
	onMovEmbedElement(element, (e) => {
		if (replaceVideoChild(e, context)) {
			count++;
		}
	});
	return count;
};
