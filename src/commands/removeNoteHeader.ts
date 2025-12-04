import type { App, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { NOTE_HEADER_SNIPPET } from "../utils/datacoreBlocks";
import { removeBlockOccurrences } from "../utils/blockRemoval";

export async function removeNoteHeaderBlocks(app: App, folder: TFolder): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	let updatedFiles = 0;
	let removedBlocks = 0;
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const { content: updated, removed } = removeBlockOccurrences(content, NOTE_HEADER_SNIPPET);

			if (removed > 0) {
				await app.vault.modify(file, updated);
				updatedFiles += 1;
				removedBlocks += removed;
			}
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	const summary =
		removedBlocks > 0
			? `Note Header 블록 ${removedBlocks}개를 ${updatedFiles}개 문서에서 제거했습니다.`
			: "Note Header 블록을 포함한 문서를 찾지 못했습니다.";

	return {
		summary,
		warnings: warnings.length ? warnings : undefined,
	};
}
