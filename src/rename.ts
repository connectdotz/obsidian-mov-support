import { App, TAbstractFile, Platform, TFile, Notice } from "obsidian";
import { Confirmation } from "./confirmation";
import { MovExtPluginContext } from "./types";

export const movRenameHelper = (context: MovExtPluginContext) => {
	const movRegex = /.*\.mov$/i;
	const inFile = (file: TFile) => {
		console.log(`metadataCache.resolvedLink=`, context.app.metadataCache.resolvedLinks);
		const cache = context.app.metadataCache.getFileCache(file);
		const movFiles = new Map<string, TFile>();
		[...(cache.embeds ?? []), ...(cache.links ?? [])].forEach((l) => {
			if (movRegex.test(l.link) && !movFiles.has(l.link)) {
				movFiles.set(
					l.link,
					context.app.metadataCache.getFirstLinkpathDest(l.link, file.path)
				);
			}
		});

		inFiles([...movFiles.values()].filter((tf) => tf));
	};

	const all = (): void => {
		const movFiles = context.app.vault
			.getFiles()
			.filter((f) => f.extension?.toLowerCase() === "mov");
		inFiles(movFiles);
	};

	const inFiles = (movFiles: TFile[]) => {
		if (movFiles.length > 0) {
			const confirmation = new Confirmation(context.app, movFiles, (result) => {
				if (result === "yes") {
					movFiles.forEach((f) => attachment(f, false));
				}
			});
			confirmation.open();
		} else {
			new Notice("no mov file to rename");
		}
	};
	const attachment = async (
		attachment: TAbstractFile,
		notify = true
	): Promise<void> => {
		const newPath = attachment.path.replace(/\.mov/i, ".mp4");
		await context.app.fileManager.renameFile(attachment, newPath);
		if (notify) {
			new Notice(`renamed ${attachment.path}`);
		}
	};

	return { all, attachment, inFile, inFiles };
};

export type RenameHelper = ReturnType<typeof movRenameHelper>;
