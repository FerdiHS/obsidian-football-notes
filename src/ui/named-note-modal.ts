import { App, ButtonComponent, Modal, TextComponent } from 'obsidian';

export type NamedNoteSubmitHandler = (value: string) => Promise<boolean>;

export interface NamedNoteModalConfig {
	title: string;
	description: string;
	fieldLabel: string;
	placeholder: string;
	submitLabel: string;
}

interface NamedNoteField {
	input: TextComponent;
}

export class NamedNoteModal extends Modal {
	private readonly onSubmit: NamedNoteSubmitHandler;
	private readonly config: NamedNoteModalConfig;
	private nameField: NamedNoteField | undefined;
	private cancelButton: ButtonComponent | undefined;
	private submitButton: ButtonComponent | undefined;
	private keydownHandler: ((event: KeyboardEvent) => void) | undefined;
	private isSubmitting = false;

	constructor(app: App, config: NamedNoteModalConfig, onSubmit: NamedNoteSubmitHandler) {
		super(app);
		this.config = config;
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.empty();
		this.setTitle(this.config.title);

		contentEl.createEl('p', {
			text: this.config.description,
		});

		this.nameField = this.createTextField(contentEl, {
			label: this.config.fieldLabel,
			placeholder: this.config.placeholder,
			id: 'football-notes-named-note',
		});

		this.nameField.input.inputEl.focus();
		this.nameField.input.inputEl.select();

		this.keydownHandler = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' || event.isComposing) {
				return;
			}

			event.preventDefault();
			void this.submit();
		};

		this.nameField.input.inputEl.addEventListener('keydown', this.keydownHandler);

		const buttonRow = contentEl.createDiv({ cls: 'modal-button-container' });
		this.cancelButton = new ButtonComponent(buttonRow);
		this.cancelButton.setButtonText('Cancel');
		this.cancelButton.onClick(() => this.close());

		this.submitButton = new ButtonComponent(buttonRow);
		this.submitButton.setButtonText(this.config.submitLabel);
		this.submitButton.setCta();
		this.submitButton.onClick(() => {
			void this.submit();
		});
	}

	onClose(): void {
		if (this.nameField !== undefined && this.keydownHandler !== undefined) {
			this.nameField.input.inputEl.removeEventListener('keydown', this.keydownHandler);
		}

		this.keydownHandler = undefined;
		this.contentEl.empty();
	}

	close(): void {
		if (!canCloseNamedNoteModal(this.isSubmitting)) {
			return;
		}

		super.close();
	}

	private async submit(): Promise<void> {
		if (this.isSubmitting || this.nameField === undefined || this.submitButton === undefined) {
			return;
		}

		this.isSubmitting = true;
		this.setButtonsDisabled(true);
		let shouldClose = false;

		try {
			shouldClose = await this.onSubmit(this.nameField.input.getValue());
		} finally {
			this.isSubmitting = false;
			this.setButtonsDisabled(false);
		}

		if (shouldClose) {
			super.close();
		}
	}

	private createTextField(
		container: HTMLElement,
		options: {
			label: string;
			placeholder: string;
			id: string;
		},
	): NamedNoteField {
		const fieldContainer = container.createDiv({ cls: 'football-notes-named-note-field' });
		const labelEl = fieldContainer.createEl('label', {
			text: options.label,
		});
		labelEl.addClass('football-notes-named-note-field-label');
		labelEl.id = `${options.id}-label`;
		labelEl.setAttr('for', options.id);

		const input = new TextComponent(fieldContainer);
		input.inputEl.id = options.id;
		input.setPlaceholder(options.placeholder);
		input.setValue('');
		input.inputEl.setAttr('aria-labelledby', labelEl.id);

		return {
			input,
		};
	}

	private setButtonsDisabled(disabled: boolean): void {
		this.cancelButton?.setDisabled(disabled);
		this.submitButton?.setDisabled(disabled);
	}
}

function canCloseNamedNoteModal(isSubmitting: boolean): boolean {
	return !isSubmitting;
}
