import { App, Modal, Setting, TFile } from "obsidian";

export type ConfirmationResult = "yes" | "no" | "cancelled";
export class Confirmation extends Modal {
	result: ConfirmationResult = 'cancelled';
	onSubmit: (result: ConfirmationResult) => void;
	files: TFile[];

	constructor(
		app: App,
		files: TFile[],
		onSubmit: (result: ConfirmationResult) => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.files = files;
	}

	async onOpen() {
		const { contentEl } = this;

		// title
		contentEl.createEl("h1", {
			text: "Rename the following .mov files to .mp4 ?",
		});

		// list of files
		contentEl.createDiv("div", (div) => {
			div.createEl("ul", undefined, (ul) => {
				this.files.forEach((f) => {
					ul.createEl("li", { text: f.path });
				});
			});
		});

    const buttons = new Setting(contentEl);
    buttons.addButton(btn => {
      btn.setButtonText("Yes")
			.setCta()
			.onClick(() => {
        this.result = 'yes';
				this.close();
				// this.onSubmit("yes");
			}); 
    });
    buttons.addButton(btn => {
      btn.setButtonText("No")
			.onClick(() => {
        this.result = 'no';
				this.close();
				// this.onSubmit("no");
			}); 
    });

	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
    this.onSubmit(this.result);
	}
}
