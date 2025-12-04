import { App, Modal, Setting } from "obsidian";

export function confirmAction(app: App, message: string): Promise<boolean> {
	return new Promise((resolve) => {
		const modal = new ConfirmationModal(app, message, resolve);
		modal.open();
	});
}

class ConfirmationModal extends Modal {
	private readonly message: string;
	private readonly resolvePromise: (result: boolean) => void;
	private resolved = false;

	constructor(app: App, message: string, resolve: (result: boolean) => void) {
		super(app);
		this.message = message;
		this.resolvePromise = resolve;
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("p", { text: this.message });

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("계속 진행")
					.setCta()
					.onClick(() => this.submit(true))
			)
			.addButton((btn) =>
				btn.setButtonText("취소").onClick(() => this.submit(false))
			);
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();

		if (!this.resolved) {
			this.resolvePromise(false);
		}
	}

	private submit(result: boolean): void {
		this.resolved = true;
		this.resolvePromise(result);
		this.close();
	}
}
