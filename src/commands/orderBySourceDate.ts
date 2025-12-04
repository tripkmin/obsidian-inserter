import type { App, TFile, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import {
	getFrontmatter,
	replaceFrontmatter,
	type FrontmatterMatch,
} from "../utils/frontmatter";

const SOURCE_DATE_REGEX = /^sourceDate:\s*(\d{4}-\d{2}-\d{2})$/m;
const TITLE_REGEX = /^title:\s*(.*?)$/m;
const ORDER_REGEX = /^order:\s*\d+$/m;

interface SortableFile {
	file: TFile;
	content: string;
	title: string;
	sourceDate: string;
	frontmatter: FrontmatterMatch;
}

export async function orderBySourceDate(
	app: App,
	folder: TFolder
): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	const sortable: SortableFile[] = [];
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const frontmatter = getFrontmatter(content);

			if (!frontmatter) {
				warnings.push(
					`${file.path}: frontmatter 블록을 찾을 수 없습니다.`
				);
				continue;
			}

			const sourceDateMatch = frontmatter.body.match(SOURCE_DATE_REGEX);
			if (!sourceDateMatch) {
				warnings.push(`${file.path}: sourceDate 값이 없어 건너뜁니다.`);
				continue;
			}

			const titleMatch = frontmatter.body.match(TITLE_REGEX);
			const rawTitle = titleMatch?.[1]?.trim() ?? file.basename;
			const title = rawTitle.replace(/^['"]|['"]$/g, "") || file.basename;

			sortable.push({
				file,
				content,
				title,
				sourceDate: sourceDateMatch[1],
				frontmatter,
			});
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	sortable.sort((a, b) => {
		const dateDiff = a.sourceDate.localeCompare(b.sourceDate);
		if (dateDiff !== 0) {
			return dateDiff;
		}
		return a.title.localeCompare(b.title);
	});

	let updated = 0;
	for (const [index, entry] of sortable.entries()) {
		const orderLine = `order: ${index + 1}`;
		const hasOrder = ORDER_REGEX.test(entry.frontmatter.body);
		const nextBody = hasOrder
			? entry.frontmatter.body.replace(ORDER_REGEX, orderLine)
			: `${entry.frontmatter.body.trimEnd()}\n${orderLine}\n`;

		const updatedContent = replaceFrontmatter(
			entry.content,
			entry.frontmatter,
			nextBody
		);
		await app.vault.modify(entry.file, updatedContent);
		updated += 1;
	}

	return {
		summary: `sourceDate 기준으로 ${updated}개 문서의 order 값을 재정렬했습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
