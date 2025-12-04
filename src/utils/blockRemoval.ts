function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function removeBlockOccurrences(content: string, snippet: string): { content: string; removed: number } {
	const escaped = escapeRegExp(snippet);
	const pattern = new RegExp(escaped, "g");

	let removed = 0;
	let updated = content.replace(pattern, () => {
		removed += 1;
		return "";
	});

	if (!removed) {
		return { content, removed: 0 };
	}

	updated = collapseBlankLines(updated);

	return { content: updated, removed };
}

function collapseBlankLines(value: string): string {
	return value.replace(/(?:\r?\n){3,}/g, "\n\n");
}
