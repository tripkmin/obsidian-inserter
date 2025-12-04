import { Notice, Plugin, TFolder } from "obsidian";
import { appendSeriesNavigator } from "./src/commands/appendSeriesNavigator";
import { insertSourceView } from "./src/commands/insertSourceView";
import { normalizeOrderValues } from "./src/commands/normalizeOrderValues";
import { orderBySourceDate } from "./src/commands/orderBySourceDate";
import { orderByTitle } from "./src/commands/orderByTitle";
import type { CommandOutcome } from "./src/types";
import { folderHasExistingOrders } from "./src/utils/order";
import { confirmAction } from "./src/ui/confirmModal";

export default class ObsidianInserterPlugin extends Plugin {
	async onload() {
		this.addCommand({
			id: "append-series-navigator-block",
			name: "현재 폴더에 Series Navigator 블록 추가",
			callback: () =>
				this.runWithActiveFolder((folder) =>
					appendSeriesNavigator(this.app, folder)
				),
		});

		this.addCommand({
			id: "insert-source-view-block",
			name: "현재 폴더에 Source View 블록 삽입",
			callback: () =>
				this.runWithActiveFolder((folder) =>
					insertSourceView(this.app, folder)
				),
		});

		this.addCommand({
			id: "order-files-by-source-date",
			name: "현재 폴더 정렬: sourceDate 기준",
			callback: () =>
				this.runWithActiveFolder(
					(folder) => orderBySourceDate(this.app, folder),
					{ warnIfOrderExists: true }
				),
		});

		this.addCommand({
			id: "order-files-by-title",
			name: "현재 폴더 정렬: 제목 기준",
			callback: () =>
				this.runWithActiveFolder(
					(folder) => orderByTitle(this.app, folder),
					{ warnIfOrderExists: true }
				),
		});

		this.addCommand({
			id: "normalize-order-values",
			name: "현재 폴더 order 값 정수 재정렬",
			callback: () =>
				this.runWithActiveFolder(
					(folder) => normalizeOrderValues(this.app, folder),
					{ warnIfOrderExists: true }
				),
		});
	}

	private async runWithActiveFolder(
		handler: (folder: TFolder) => Promise<CommandOutcome>,
		options?: { warnIfOrderExists?: boolean }
	): Promise<void> {
		const folder = this.getActiveFolder();

		if (!folder) {
			new Notice(
				"명령을 실행하기 전에 처리할 노트를 하나 연 뒤 다시 시도하세요."
			);
			return;
		}

		if (options?.warnIfOrderExists) {
			const hasOrder = await folderHasExistingOrders(this.app, folder);
			if (hasOrder) {
				const confirmed = await confirmAction(
					this.app,
					"이 폴더에는 기존 order 값이 있습니다. 계속 진행하시겠습니까?"
				);

				if (!confirmed) {
					new Notice("사용자가 명령을 취소했습니다.");
					return;
				}
			}
		}

		try {
			const outcome = await handler(folder);
			const folderLabel = folder.path || "/";
			new Notice(`${outcome.summary} (폴더: ${folderLabel})`);

			if (outcome.warnings?.length) {
				console.warn("Obsidian Inserter 경고:", outcome.warnings);
			}
		} catch (error) {
			console.error(error);
			new Notice(
				"명령 실행에 실패했습니다. 자세한 내용은 콘솔을 확인하세요."
			);
		}
	}

	private getActiveFolder(): TFolder | null {
		const activeFile = this.app.workspace.getActiveFile();
		return activeFile?.parent ?? null;
	}
}
