import { App, ButtonComponent, Modal, TextComponent } from 'obsidian';

import { canCloseMatchUrlModal } from './match-url-modal-state';

export type MatchUrlSubmitHandler = (value: string) => Promise<boolean>;

export class MatchUrlModal extends Modal {
	private readonly onSubmit: MatchUrlSubmitHandler;
	private matchUrlInput: TextComponent | undefined;
	private cancelButton: ButtonComponent | undefined;
	private createButton: ButtonComponent | undefined;
	private keydownHandler: ((event: KeyboardEvent) => void) | undefined;
	private isSubmitting = false;

	constructor(app: App, onSubmit: MatchUrlSubmitHandler) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.empty();
		this.setTitle('Create match note from URL');

		contentEl.createEl('p', {
			text: 'Paste a football match URL to create a new match note.',
		});

		const inputContainer = contentEl.createDiv({ cls: 'football-notes-match-url-input' });
		this.matchUrlInput = new TextComponent(inputContainer);
		this.matchUrlInput.setPlaceholder('https://example.com/match/123');
		this.matchUrlInput.setValue('');
		this.matchUrlInput.inputEl.focus();
		this.matchUrlInput.inputEl.select();

		this.keydownHandler = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' || event.isComposing) {
				return;
			}

			event.preventDefault();
			void this.submit();
		};
		this.matchUrlInput.inputEl.addEventListener('keydown', this.keydownHandler);

		const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
		this.cancelButton = new ButtonComponent(buttonRow);
		this.cancelButton.setButtonText('Cancel');
		this.cancelButton.onClick(() => this.close());

		this.createButton = new ButtonComponent(buttonRow);
		this.createButton.setButtonText('Create note');
		this.createButton.setCta();
		this.createButton.onClick(() => {
			void this.submit();
		});
	}

	onClose(): void {
		if (this.matchUrlInput && this.keydownHandler) {
			this.matchUrlInput.inputEl.removeEventListener('keydown', this.keydownHandler);
		}

		this.keydownHandler = undefined;
		this.contentEl.empty();
	}

	close(): void {
		if (!canCloseMatchUrlModal(this.isSubmitting)) {
			return;
		}

		super.close();
	}

	private async submit(): Promise<void> {
		if (
			this.isSubmitting ||
			this.matchUrlInput === undefined ||
			this.createButton === undefined
		) {
			return;
		}

		this.isSubmitting = true;
		this.setButtonsDisabled(true);
		let shouldClose = false;

		try {
			shouldClose = await this.onSubmit(this.matchUrlInput.getValue());
		} finally {
			this.isSubmitting = false;
			this.setButtonsDisabled(false);
		}

		if (shouldClose) {
			super.close();
		}
	}

	private setButtonsDisabled(disabled: boolean): void {
		this.cancelButton?.setDisabled(disabled);
		this.createButton?.setDisabled(disabled);
	}
}
