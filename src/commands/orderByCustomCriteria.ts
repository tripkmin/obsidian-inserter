import type { App, TFile, TFolder } from "obsidian";
import type { CommandOutcome, OrderCriterion } from "../types";
import { getMarkdownFiles } from "../utils/files";
import { getFrontmatter, replaceFrontmatter, type FrontmatterMatch } from "../utils/frontmatter";
import { ORDER_LINE_REGEX } from "../utils/order";
import { naturalCompare } from "../utils/naturalSort";

type SortValue = { type: "number" | "string"; value: number | string };

interface SortableEntry {
	file: TFile;
	content: string;
	frontmatter: FrontmatterMatch;
	sortValues: SortValue[];
}

export async function orderByCustomCriteria(
	app: App,
	folder: TFolder,
	criteria: OrderCriterion[]
): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	const entries: SortableEntry[] = [];
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			const frontmatter = getFrontmatter(content);

			if (!frontmatter) {
				warnings.push(`${file.path}: frontmatter 블록을 찾을 수 없어 건너뜁니다.`);
				continue;
			}

			const metadata = app.metadataCache.getFileCache(file);
			const frontmatterData = metadata?.frontmatter;
			const sortValues = criteria.map((criterion) => computeSortValue(criterion, frontmatterData, file));
			entries.push({ file, content, frontmatter, sortValues });
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	if (!entries.length) {
		return {
			summary: "정렬 가능한 문서를 찾지 못했습니다.",
			warnings: warnings.length ? warnings : undefined,
		};
	}

	entries.sort((a, b) => {
		for (let i = 0; i < a.sortValues.length; i += 1) {
			const diff = compareSortValues(a.sortValues[i], b.sortValues[i]);
			if (diff !== 0) {
				return diff;
			}
		}
		return naturalCompare(a.file.path, b.file.path);
	});

	for (const [index, entry] of entries.entries()) {
		const newOrderLine = `order: ${index + 1}`;
		const updatedFrontmatter = entry.frontmatter.body.replace(ORDER_LINE_REGEX, (match) => {
			return match.startsWith("order:") ? newOrderLine : match;
		});

		const hasOrder = ORDER_LINE_REGEX.test(entry.frontmatter.body);
		const frontmatterBody = hasOrder
			? updatedFrontmatter
			: `${entry.frontmatter.body.trimEnd()}\n${newOrderLine}\n`;

		const updatedContent = replaceFrontmatter(entry.content, entry.frontmatter, frontmatterBody);
		await app.vault.modify(entry.file, updatedContent);
	}

	return {
		summary: `${entries.length}개 문서를 사용자 지정 기준으로 정렬했습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}

function computeSortValue(
	criterion: OrderCriterion,
	frontmatterData: Record<string, unknown> | undefined,
	file: TFile
): SortValue {
	switch (criterion.type) {
		case "frontmatter":
			return normalizeValue(frontmatterData?.[criterion.key]);
		case "ctime":
			return { type: "number", value: file.stat.ctime };
		case "mtime":
			return { type: "number", value: file.stat.mtime };
		case "filename":
		default:
			return { type: "string", value: file.basename.toLocaleLowerCase() };
	}
}

function normalizeValue(rawValue: unknown): SortValue {
	if (rawValue === null || rawValue === undefined) {
		return { type: "string", value: "" };
	}

	if (Array.isArray(rawValue)) {
		return normalizeValue(rawValue[0]);
	}

	if (rawValue instanceof Date) {
		return { type: "number", value: rawValue.getTime() };
	}

	if (typeof rawValue === "number") {
		return { type: "number", value: rawValue };
	}

	if (typeof rawValue === "boolean") {
		return { type: "string", value: rawValue ? "true" : "false" };
	}

	if (typeof rawValue === "string") {
		const parsedNumber = Number(rawValue);
		if (!Number.isNaN(parsedNumber)) {
			return { type: "number", value: parsedNumber };
		}

		const parsedDate = Date.parse(rawValue);
		if (!Number.isNaN(parsedDate)) {
			return { type: "number", value: parsedDate };
		}

		return { type: "string", value: rawValue.toLocaleLowerCase() };
	}

	return { type: "string", value: String(rawValue) };
}

function compareSortValues(a: SortValue, b: SortValue): number {
	if (a.type === "number" && b.type === "number") {
		if (a.value < b.value) return -1;
		if (a.value > b.value) return 1;
		return 0;
	}

	const aStr = typeof a.value === "string" ? a.value : a.value.toString();
	const bStr = typeof b.value === "string" ? b.value : b.value.toString();
	return naturalCompare(aStr, bStr);
}
