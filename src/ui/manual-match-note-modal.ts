import { App, ButtonComponent, Modal, TextComponent } from 'obsidian';

import type { ManualMatchNoteSubmission } from '../types';

export type ManualMatchNoteSubmitHandler = (input: ManualMatchNoteSubmission) => Promise<boolean>;

interface ManualMatchNoteField {
	input: TextComponent;
}

export class ManualMatchNoteModal extends Modal {
	private readonly onSubmit: ManualMatchNoteSubmitHandler;
	private homeTeamField: ManualMatchNoteField | undefined;
	private awayTeamField: ManualMatchNoteField | undefined;
	private matchDateField: ManualMatchNoteField | undefined;
	private competitionField: ManualMatchNoteField | undefined;
	private sourceUrlField: ManualMatchNoteField | undefined;
	private cancelButton: ButtonComponent | undefined;
	private createButton: ButtonComponent | undefined;
	private keydownHandler: ((event: KeyboardEvent) => void) | undefined;
	private isSubmitting = false;

	constructor(app: App, onSubmit: ManualMatchNoteSubmitHandler) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen(): void {
		const { contentEl } = this;

		contentEl.empty();
		this.setTitle('Create manual match note');

		contentEl.createEl('p', {
			text: 'Enter the match details to create a new match note.',
		});

		this.homeTeamField = this.createTextField(contentEl, {
			label: 'Home team',
			placeholder: 'Real Madrid',
			id: 'football-notes-manual-match-home-team',
		});

		this.awayTeamField = this.createTextField(contentEl, {
			label: 'Away team',
			placeholder: 'Barcelona',
			id: 'football-notes-manual-match-away-team',
		});

		this.matchDateField = this.createTextField(contentEl, {
			label: 'Match date',
			placeholder: '2026-07-01',
			id: 'football-notes-manual-match-date',
		});

		this.competitionField = this.createTextField(contentEl, {
			label: 'Competition',
			placeholder: 'La Liga',
			id: 'football-notes-manual-match-competition',
		});

		this.sourceUrlField = this.createTextField(contentEl, {
			label: 'Source URL (optional)',
			placeholder: 'https://example.com/match',
			id: 'football-notes-manual-match-source-url',
		});

		this.homeTeamField.input.inputEl.focus();
		this.homeTeamField.input.inputEl.select();

		this.keydownHandler = (event: KeyboardEvent) => {
			if (event.key !== 'Enter' || event.isComposing) {
				return;
			}

			event.preventDefault();
			void this.submit();
		};

		for (const field of this.getAllFields()) {
			field.input.inputEl.addEventListener('keydown', this.keydownHandler);
		}

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
		if (this.keydownHandler !== undefined) {
			for (const field of this.getAllFields()) {
				field.input.inputEl.removeEventListener('keydown', this.keydownHandler);
			}
		}

		this.keydownHandler = undefined;
		this.contentEl.empty();
	}

	close(): void {
		if (!canCloseManualMatchNoteModal(this.isSubmitting)) {
			return;
		}

		super.close();
	}

	private async submit(): Promise<void> {
		if (
			this.isSubmitting ||
			this.homeTeamField === undefined ||
			this.awayTeamField === undefined ||
			this.matchDateField === undefined ||
			this.competitionField === undefined ||
			this.sourceUrlField === undefined ||
			this.createButton === undefined
		) {
			return;
		}

		this.isSubmitting = true;
		this.setButtonsDisabled(true);
		let shouldClose = false;

		try {
			const sourceUrl = this.sourceUrlField.input.getValue().trim();

			shouldClose = await this.onSubmit({
				homeTeam: this.homeTeamField.input.getValue(),
				awayTeam: this.awayTeamField.input.getValue(),
				matchDate: this.matchDateField.input.getValue(),
				competition: this.competitionField.input.getValue(),
				...(sourceUrl.length > 0 ? { sourceUrl } : {}),
			});
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
	): ManualMatchNoteField {
		const fieldContainer = container.createDiv({ cls: 'football-notes-manual-match-field' });
		const labelEl = fieldContainer.createEl('label', {
			text: options.label,
		});
		labelEl.addClass('football-notes-manual-match-field-label');
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

	private getAllFields(): ManualMatchNoteField[] {
		return [
			this.homeTeamField,
			this.awayTeamField,
			this.matchDateField,
			this.competitionField,
			this.sourceUrlField,
		].filter((field): field is ManualMatchNoteField => field !== undefined);
	}

	private setButtonsDisabled(disabled: boolean): void {
		this.cancelButton?.setDisabled(disabled);
		this.createButton?.setDisabled(disabled);
	}
}

function canCloseManualMatchNoteModal(isSubmitting: boolean): boolean {
	return !isSubmitting;
}
