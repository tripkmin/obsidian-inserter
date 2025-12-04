import type { App, TFile, TFolder } from "obsidian";
import type { CommandOutcome } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { getFrontmatter, replaceFrontmatter, type FrontmatterMatch } from "../utils/frontmatter";

const ORDER_CAPTURE_REGEX = /^order:\s*.+$/m;
const ORDER_NUMERIC_REGEX = /^order:\s*(-?\d+(?:\.\d+)?)$/m;

interface OrderEntry {
	content: string;
	frontmatter: FrontmatterMatch;
	order: number;
	filePath: string;
	fileName: string;
	file: TFile;
}

export async function normalizeOrderValues(app: App, folder: TFolder): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	const entries: OrderEntry[] = [];
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const frontmatter = getFrontmatter(content);

			if (!frontmatter) {
				continue;
			}

			const match = frontmatter.body.match(ORDER_NUMERIC_REGEX);
			if (!match) {
				continue;
			}

			const numericValue = Number(match[1]);
			if (Number.isNaN(numericValue)) {
				warnings.push(`${file.path}: order 값을 숫자로 해석할 수 없습니다.`);
				continue;
			}

			entries.push({
				content,
				frontmatter,
				order: numericValue,
				filePath: file.path,
				fileName: file.basename,
				file,
			});
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	if (!entries.length) {
		return {
			summary: "order 값을 가진 문서를 찾지 못했습니다.",
			warnings: warnings.length ? warnings : undefined,
		};
	}

	entries.sort((a, b) => {
		const diff = a.order - b.order;
		if (Math.abs(diff) > Number.EPSILON) {
			return diff;
		}

		return a.fileName.localeCompare(b.fileName);
	});

	for (const [index, entry] of entries.entries()) {
		const newOrderLine = `order: ${index + 1}`;
		const updatedFrontmatter = entry.frontmatter.body.replace(ORDER_CAPTURE_REGEX, newOrderLine);
		const updatedContent = replaceFrontmatter(entry.content, entry.frontmatter, updatedFrontmatter);
		await app.vault.modify(entry.file, updatedContent);
	}

	return {
		summary: `${entries.length}개 문서의 order 값을 1부터 시작하는 정수로 재정렬했습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
