import type { App, TFolder } from "obsidian";
import { getMarkdownFiles } from "./files";
import { getFrontmatter } from "./frontmatter";

export const ORDER_LINE_REGEX = /^order:\s*.+$/m;

export async function folderHasExistingOrders(app: App, folder: TFolder): Promise<boolean> {
	const files = getMarkdownFiles(folder);

	for (const file of files) {
		try {
			const content = await app.vault.cachedRead(file);
			const frontmatter = getFrontmatter(content);

			if (frontmatter && ORDER_LINE_REGEX.test(frontmatter.body)) {
				return true;
			}
		} catch (error) {
			console.error(`Failed to inspect order in ${file.path}`, error);
		}
	}

	return false;
}
