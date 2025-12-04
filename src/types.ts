export interface CommandOutcome {
	summary: string;
	warnings?: string[];
}

export type OrderCriterion =
	| { type: "frontmatter"; key: string }
	| { type: "filename" }
	| { type: "ctime" }
	| { type: "mtime" };
