import { TFile } from "obsidian";
import type { TAbstractFile, TFolder } from "obsidian";

function isMarkdownFile(entry: TAbstractFile): entry is TFile {
	return entry instanceof TFile && entry.extension === "md";
}

export function getMarkdownFiles(folder: TFolder): TFile[] {
	return folder.children.filter(isMarkdownFile);
}
