import type { App, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { getFrontmatter } from "../utils/frontmatter";
import { NOTE_HEADER_SNIPPET } from "../utils/datacoreBlocks";

const HEADING1_REGEX = /^# (?!#).*$/m;

export async function insertNoteHeader(
	app: App,
	folder: TFolder
): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	let processed = 0;
	let skipped = 0;
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);

			if (content.includes(NOTE_HEADER_SNIPPET)) {
				skipped += 1;
				continue;
			}

			const frontmatter = getFrontmatter(content);
			if (!frontmatter) {
				warnings.push(
					`${file.path}: frontmatter 블록을 찾을 수 없습니다.`
				);
				continue;
			}

			const restContent = content.slice(frontmatter.end);
			const headingMatch = restContent.match(HEADING1_REGEX);
			let updatedContent: string;

			if (headingMatch && headingMatch.index !== undefined) {
				const headingEnd =
					frontmatter.end +
					headingMatch.index +
					headingMatch[0].length;
				updatedContent = `${content.slice(
					0,
					headingEnd
				)}\n\n${NOTE_HEADER_SNIPPET}\n\n${content.slice(headingEnd)}`;
			} else {
				updatedContent = `${content.slice(
					0,
					frontmatter.end
				)}\n${NOTE_HEADER_SNIPPET}\n\n${restContent}`;
			}

			await app.vault.modify(file, updatedContent);
			processed += 1;
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	return {
		summary: `Note Header 블록을 ${processed}개 문서에 삽입했고, ${skipped}개 문서는 이미 포함하고 있었습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
