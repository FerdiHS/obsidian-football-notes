import { deepStrictEqual, strictEqual } from 'node:assert';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';

import type { ManualMatchNoteSubmission } from '../types';
import { ButtonComponent, TextComponent } from './modal-test-support';

let ManualMatchNoteModal: typeof import('./manual-match-note-modal').ManualMatchNoteModal;
const manualMatchNoteModalReady = createJiti(import.meta.url, {
	alias: {
		obsidian: fileURLToPath(new URL('./modal-test-support.ts', import.meta.url)),
	},
	moduleCache: false,
	fsCache: false,
})
	.import<typeof import('./manual-match-note-modal')>('./manual-match-note-modal')
	.then((module) => {
		ManualMatchNoteModal = module.ManualMatchNoteModal;
	});

type TestField = {
	input: TextComponent;
};

type TestModal = {
	onOpen(): void;
	close(): void;
	closed: boolean;
	homeTeamField: TestField;
	awayTeamField: TestField;
	matchDateField: TestField;
	competitionField: TestField;
	sourceUrlField: TestField;
	cancelButton: ButtonComponent;
	createButton: ButtonComponent;
	submit(): Promise<void>;
};

async function openModal(
	onSubmit: (input: ManualMatchNoteSubmission) => Promise<boolean>,
): Promise<TestModal> {
	await manualMatchNoteModalReady;
	const modal = new ManualMatchNoteModal({} as never, onSubmit) as unknown as TestModal;
	modal.onOpen();
	return modal;
}

function getAllFields(modal: TestModal): TestField[] {
	return [
		modal.homeTeamField,
		modal.awayTeamField,
		modal.matchDateField,
		modal.competitionField,
		modal.sourceUrlField,
	];
}

function setFieldValues(modal: TestModal, sourceUrl = ''): void {
	modal.homeTeamField.input.setValue('Arsenal');
	modal.awayTeamField.input.setValue('Chelsea');
	modal.matchDateField.input.setValue('2026-08-15');
	modal.competitionField.input.setValue('Premier League');
	modal.sourceUrlField.input.setValue(sourceUrl);
}

function keydown(
	field: TestField,
	key: string,
	isComposing = false,
): { defaultPrevented: boolean } {
	const event = {
		key,
		isComposing,
		defaultPrevented: false,
		preventDefault() {
			this.defaultPrevented = true;
		},
	};

	for (const listener of field.input.inputEl.listeners.get('keydown') ?? []) {
		listener(event as never);
	}

	return event;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((promiseResolve) => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
}

void test('Enter submits from every field and passes all field values', async () => {
	const submissions: ManualMatchNoteSubmission[] = [];
	const modal = await openModal(async (input) => {
		submissions.push(input);
		return false;
	});
	setFieldValues(modal, '  https://example.com/match  ');

	for (const field of getAllFields(modal)) {
		const event = keydown(field, 'Enter');
		await setImmediate();
		strictEqual(event.defaultPrevented, true);
	}

	strictEqual(submissions.length, 5);
	for (const submission of submissions) {
		deepStrictEqual(submission, {
			homeTeam: 'Arsenal',
			awayTeam: 'Chelsea',
			matchDate: '2026-08-15',
			competition: 'Premier League',
			sourceUrl: 'https://example.com/match',
		});
	}
});

void test('Enter during IME composition does not submit from any field', async () => {
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return false;
	});

	for (const field of getAllFields(modal)) {
		const event = keydown(field, 'Enter', true);
		strictEqual(event.defaultPrevented, false);
	}
	await setImmediate();

	strictEqual(submissions, 0);
});

void test('a whitespace-only optional source URL is omitted from submission', async () => {
	let submission: ManualMatchNoteSubmission | undefined;
	const modal = await openModal(async (input) => {
		submission = input;
		return false;
	});
	setFieldValues(modal, '   ');

	await modal.submit();

	deepStrictEqual(submission, {
		homeTeam: 'Arsenal',
		awayTeam: 'Chelsea',
		matchDate: '2026-08-15',
		competition: 'Premier League',
	});
	strictEqual(modal.closed, false);
});

void test('the cancel button closes the modal and removes every keydown listener', async () => {
	const modal = await openModal(async () => false);
	const fields = getAllFields(modal);

	for (const field of fields) {
		strictEqual(field.input.inputEl.listeners.get('keydown')?.size, 1);
	}

	modal.cancelButton.click();

	strictEqual(modal.closed, true);
	for (const field of fields) {
		strictEqual(field.input.inputEl.listeners.get('keydown')?.size, 0);
	}
});

void test('button, Enter, and direct submissions share the same pending guard', async () => {
	const pending = deferred<boolean>();
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return pending.promise;
	});
	setFieldValues(modal);

	modal.createButton.click();
	strictEqual(submissions, 1);

	const event = keydown(modal.awayTeamField, 'Enter');
	void modal.submit();
	modal.createButton.click();

	strictEqual(event.defaultPrevented, true);
	strictEqual(submissions, 1);

	pending.resolve(false);
	await setImmediate();
});

void test('pending submission disables controls, prevents close, and restores after false', async () => {
	const pending = deferred<boolean>();
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return pending.promise;
	});

	void modal.submit();

	strictEqual(modal.createButton.disabled, true);
	strictEqual(modal.cancelButton.disabled, true);

	modal.cancelButton.click();
	modal.close();
	strictEqual(modal.closed, false);

	pending.resolve(false);
	await setImmediate();

	strictEqual(modal.createButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
	strictEqual(modal.closed, false);

	await modal.submit();
	strictEqual(submissions, 2);
	strictEqual(modal.closed, false);
});

void test('a true result restores controls, closes the modal, and removes listeners', async () => {
	const modal = await openModal(async () => true);
	const fields = getAllFields(modal);

	await modal.submit();

	strictEqual(modal.createButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
	strictEqual(modal.closed, true);
	for (const field of fields) {
		strictEqual(field.input.inputEl.listeners.get('keydown')?.size, 0);
	}
});

void test('a thrown error restores controls and preserves the exact error', async () => {
	const error = new Error('submission failed');
	const modal = await openModal(async () => {
		throw error;
	});

	let caught: unknown;
	try {
		await modal.submit();
	} catch (submissionError) {
		caught = submissionError;
	}

	strictEqual(caught, error);
	strictEqual(modal.createButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
	strictEqual(modal.closed, false);
	for (const field of getAllFields(modal)) {
		strictEqual(field.input.inputEl.listeners.get('keydown')?.size, 1);
	}
});
