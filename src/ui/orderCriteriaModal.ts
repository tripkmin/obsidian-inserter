import { App, Modal, Notice, Setting } from "obsidian";
import type { OrderCriterion } from "../types";

type EncodedOption = string;

const STATIC_OPTIONS: Array<{ value: EncodedOption; label: string }> = [
	{ value: "filename", label: "파일명" },
	{ value: "ctime", label: "생성일" },
	{ value: "mtime", label: "수정일" },
];

function encodeFrontmatter(key: string): EncodedOption {
	return `frontmatter|${key}`;
}

function decodeOption(value: EncodedOption): OrderCriterion | null {
	if (value === "filename") {
		return { type: "filename" };
	}

	if (value === "ctime") {
		return { type: "ctime" };
	}

	if (value === "mtime") {
		return { type: "mtime" };
	}

	if (value.startsWith("frontmatter|")) {
		const key = value.split("|").slice(1).join("|");
		if (key) {
			return { type: "frontmatter", key };
		}
	}

	return null;
}

export class OrderCriteriaModal extends Modal {
	private readonly frontmatterKeys: string[];
	private resolvePromise: ((criteria: OrderCriterion[] | null) => void) | null = null;
	private selections: EncodedOption[] = ["filename"];

	constructor(app: App, frontmatterKeys: string[]) {
		super(app);
		this.frontmatterKeys = frontmatterKeys;
	}

	async openAndGetCriteria(): Promise<OrderCriterion[] | null> {
		return new Promise((resolve) => {
			this.resolvePromise = resolve;
			this.open();
		});
	}

	onOpen(): void {
		this.render();
	}

	onClose(): void {
		if (this.resolvePromise) {
			this.resolvePromise(null);
			this.resolvePromise = null;
		}
		this.contentEl.empty();
	}

	private render(): void {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h3", { text: "order 정렬 기준 선택" });
		contentEl.createEl("p", {
			text: "1순위부터 사용할 정렬 기준을 선택하세요. 필요하면 기준을 추가하거나 삭제할 수 있습니다.",
		});

		this.selections.forEach((_selection, index) => {
			this.renderRow(contentEl, index);
		});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("기준 추가")
					.onClick(() => {
						this.selections.push(this.frontmatterKeys[0] ? encodeFrontmatter(this.frontmatterKeys[0]) : "filename");
						this.render();
					})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("reset")
					.setTooltip("모두 삭제")
					.onClick(() => {
						this.selections = ["filename"];
						this.render();
					})
			);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("정렬 시작")
					.setCta()
					.onClick(() => this.submit())
			)
			.addButton((btn) =>
				btn.setButtonText("취소").onClick(() => {
					this.close();
				})
			);
	}

	private renderRow(containerEl: HTMLElement, index: number): void {
		const selectionSetting = new Setting(containerEl).setName(`${index + 1}순위 기준`);

		selectionSetting.addDropdown((dropdown) => {
			for (const option of STATIC_OPTIONS) {
				dropdown.addOption(option.value, option.label);
			}

			for (const key of this.frontmatterKeys) {
				const value = encodeFrontmatter(key);
				dropdown.addOption(value, `frontmatter · ${key}`);
			}

			const currentValue = this.selections[index];
			if (!currentValue) {
				this.selections[index] = "filename";
			}

			dropdown.setValue(this.selections[index] ?? "filename");
			dropdown.onChange((value) => {
				this.selections[index] = value as EncodedOption;
			});
		});

		if (this.selections.length > 1) {
			selectionSetting.addExtraButton((btn) =>
				btn
					.setIcon("trash")
					.setTooltip("이 기준 삭제")
					.onClick(() => {
						this.selections.splice(index, 1);
						this.render();
					})
			);
		}
	}

	private submit(): void {
		if (!this.selections.length) {
			new Notice("최소 1개의 정렬 기준을 선택해야 합니다.");
			return;
		}

		const criteria: OrderCriterion[] = [];

		for (const selection of this.selections) {
			const decoded = decodeOption(selection);
			if (!decoded) {
				continue;
			}
			criteria.push(decoded);
		}

		if (!criteria.length) {
			new Notice("사용 가능한 정렬 기준을 해석하지 못했습니다.");
			return;
		}

		if (this.resolvePromise) {
			this.resolvePromise(criteria);
			this.resolvePromise = null;
		}

		this.close();
	}
}
