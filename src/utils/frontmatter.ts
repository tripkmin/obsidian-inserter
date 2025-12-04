export interface FrontmatterMatch {
	body: string;
	start: number;
	end: number;
}

const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)\s*---\s*/;

export function getFrontmatter(content: string): FrontmatterMatch | null {
	const match = content.match(FRONTMATTER_REGEX);
	if (!match) {
		return null;
	}

	const start = match.index ?? 0;
	if (start !== 0) {
		return null;
	}

	return {
		body: match[1],
		start,
		end: start + match[0].length,
	};
}

export function replaceFrontmatter(content: string, frontmatter: FrontmatterMatch, nextBody: string): string {
	const before = content.slice(0, frontmatter.start);
	const after = content.slice(frontmatter.end);
	const sanitizedBody = nextBody.trimEnd();
	const needsNewline = after === "" || after.startsWith("\n") || after.startsWith("\r") ? "" : "\n";
	return `${before}---\n${sanitizedBody}\n---${needsNewline}${after}`;
}
