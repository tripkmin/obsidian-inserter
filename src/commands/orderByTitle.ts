import type { App, TFile, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { getFrontmatter, replaceFrontmatter, type FrontmatterMatch } from "../utils/frontmatter";

const TITLE_REGEX = /^title:\s*(.*?)$/m;
const ORDER_REGEX = /^order:\s*\d+$/m;

interface SortableEntry {
	file: TFile;
	content: string;
	frontmatter: FrontmatterMatch;
	title: string;
	titleKey: string;
}

export async function orderByTitle(app: App, folder: TFolder): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	const sortable: SortableEntry[] = [];
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const frontmatter = getFrontmatter(content);

			if (!frontmatter) {
				warnings.push(`${file.path}: frontmatter 블록을 찾을 수 없습니다.`);
				continue;
			}

			const titleMatch = frontmatter.body.match(TITLE_REGEX);
			const rawTitle = titleMatch?.[1]?.trim() ?? file.basename;
			const title = rawTitle.replace(/^['"]|['"]$/g, "") || file.basename;
			const titleKey = title.toLocaleLowerCase();

			sortable.push({ file, content, frontmatter, title, titleKey });
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	sortable.sort((a, b) => {
		const titleDiff = a.titleKey.localeCompare(b.titleKey);
		if (titleDiff !== 0) {
			return titleDiff;
		}
		return a.file.path.localeCompare(b.file.path);
	});

	let updated = 0;

	for (const [index, entry] of sortable.entries()) {
		const orderLine = `order: ${index + 1}`;
		const nextBody = ORDER_REGEX.test(entry.frontmatter.body)
			? entry.frontmatter.body.replace(ORDER_REGEX, orderLine)
			: `${entry.frontmatter.body.trimEnd()}\n${orderLine}\n`;

		const updatedContent = replaceFrontmatter(entry.content, entry.frontmatter, nextBody);
		await app.vault.modify(entry.file, updatedContent);
		updated += 1;
	}

	return {
		summary: `제목 기준으로 ${updated}개 문서의 order 값을 재정렬했습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
