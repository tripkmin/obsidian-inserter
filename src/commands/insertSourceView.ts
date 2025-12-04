import type { App, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { getFrontmatter } from "../utils/frontmatter";

const SOURCE_VIEW_BLOCK = [
	"```datacorejsx",
	"const { PATH } = customJS;",
	'const { SourceView } = await dc.require(dc.headerLink(`${PATH.DATACORE_TEMPLATE}/SourceView.md`, "SourceView"));',
	"",
	"return function View(){",
	"\treturn (<SourceView />)",
	"}",
	"```",
	"",
].join("\n");

const SOURCE_VIEW_SNIPPET = SOURCE_VIEW_BLOCK.trim();
const HEADING1_REGEX = /^# (?!#).*$/m;

export async function insertSourceView(
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

			if (content.includes(SOURCE_VIEW_SNIPPET)) {
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
				)}\n\n${SOURCE_VIEW_SNIPPET}\n\n${content.slice(headingEnd)}`;
			} else {
				updatedContent = `${content.slice(
					0,
					frontmatter.end
				)}\n${SOURCE_VIEW_SNIPPET}\n\n${restContent}`;
			}

			await app.vault.modify(file, updatedContent);
			processed += 1;
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	return {
		summary: `Source View 블록을 ${processed}개 문서에 삽입했고, ${skipped}개 문서는 이미 포함하고 있었습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
