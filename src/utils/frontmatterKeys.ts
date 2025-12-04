import type { App } from "obsidian";

export function collectFrontmatterKeys(app: App): string[] {
	const keys = new Set<string>();
	const { metadataCache, vault } = app;

	for (const file of vault.getMarkdownFiles()) {
		const fileCache = metadataCache.getFileCache(file);
		const frontmatter = fileCache?.frontmatter;

		if (!frontmatter) {
			continue;
		}

		for (const key of Object.keys(frontmatter)) {
			if (key === "position") {
				continue;
			}

			keys.add(key);
		}
	}

	return Array.from(keys).sort((a, b) => a.localeCompare(b));
}
