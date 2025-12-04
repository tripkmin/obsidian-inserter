import type { App, TFolder } from "obsidian";
import { getMarkdownFiles } from "../utils/files";
import type { CommandOutcome } from "../types";

const SERIES_NAVIGATOR_BLOCK = [
	"",
	"```datacorejsx",
	"const { PATH } = customJS;",
	'const { SeriesNavigator } = await dc.require(',
	'  dc.headerLink(`${PATH.DATACORE_TEMPLATE}/SeriesNavigator.md`, "SeriesNavigator")',
	");",
	"",
	"return function View() {",
	"  return <SeriesNavigator />;",
	"};",
	"```",
	"",
].join("\n");

const SERIES_NAVIGATOR_SNIPPET = SERIES_NAVIGATOR_BLOCK.trim();

export async function appendSeriesNavigator(app: App, folder: TFolder): Promise<CommandOutcome> {
	const files = getMarkdownFiles(folder);
	let processed = 0;
	let skipped = 0;
	const warnings: string[] = [];

	for (const file of files) {
		try {
			const content = await app.vault.read(file);
			if (content.includes(SERIES_NAVIGATOR_SNIPPET)) {
				skipped += 1;
				continue;
			}

			await app.vault.append(file, SERIES_NAVIGATOR_BLOCK);
			processed += 1;
		} catch (error) {
			console.error(error);
			warnings.push(`${file.path}: 오류 - ${(error as Error).message}`);
		}
	}

	return {
		summary: `Series Navigator 블록을 ${processed}개 문서에 추가했고, ${skipped}개 문서에는 이미 존재했습니다.`,
		warnings: warnings.length ? warnings : undefined,
	};
}
