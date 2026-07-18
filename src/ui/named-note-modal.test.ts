/* eslint-disable no-undef, @typescript-eslint/no-floating-promises */

import { deepStrictEqual, strictEqual } from 'node:assert';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { setImmediate } from 'node:timers/promises';
import { mock, test } from 'node:test';

class TestElement {
	children: TestElement[] = [];
	listeners = new Map<string, Set<(event: KeyboardEvent) => void>>();
	id = '';

	empty(): void {
		this.children = [];
	}

	createEl(): TestElement {
		const child = new TestElement();
		this.children.push(child);
		return child;
	}

	createDiv(): TestElement {
		return this.createEl();
	}

	addClass(): void {}

	setAttr(): void {}

	addEventListener(type: string, listener: (event: KeyboardEvent) => void): void {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener);
		this.listeners.set(type, listeners);
	}

	removeEventListener(type: string, listener: (event: KeyboardEvent) => void): void {
		this.listeners.get(type)?.delete(listener);
	}

	focus(): void {}

	select(): void {}
}

class Modal {
	contentEl = new TestElement();
	closed = false;
	title = '';

	constructor(public app: unknown) {}

	setTitle(title: string): void {
		this.title = title;
	}

	close(): void {
		this.closed = true;
		(this as unknown as { onClose?: () => void }).onClose?.();
	}
}

class ButtonComponent {
	disabled = false;
	private clickHandler: (() => void) | undefined;

	constructor(public containerEl: TestElement) {}

	setButtonText(): this {
		return this;
	}

	setCta(): this {
		return this;
	}

	onClick(handler: () => void): this {
		this.clickHandler = handler;
		return this;
	}

	setDisabled(disabled: boolean): this {
		this.disabled = disabled;
		return this;
	}

	click(): void {
		if (!this.disabled) this.clickHandler?.();
	}
}

class TextComponent {
	inputEl = new TestElement();
	private value = '';

	constructor(public containerEl: TestElement) {}

	setPlaceholder(): this {
		return this;
	}

	setValue(value: string): this {
		this.value = value;
		return this;
	}

	getValue(): string {
		return this.value;
	}
}

const localObsidianPackagePath = join(process.cwd(), 'node_modules', 'obsidian', 'package.json');
const localObsidianIndexPath = join(process.cwd(), 'node_modules', 'obsidian', 'index.js');
const originalObsidianPackage = readFileSync(localObsidianPackagePath, 'utf8');
const packageJson = JSON.parse(originalObsidianPackage) as { main?: string };
packageJson.main = 'index.js';
writeFileSync(localObsidianPackagePath, `${JSON.stringify(packageJson)}\n`);
writeFileSync(localObsidianIndexPath, 'module.exports = {};\n');
process.once('exit', () => {
	writeFileSync(localObsidianPackagePath, originalObsidianPackage);
	unlinkSync(localObsidianIndexPath);
});

mock.module('obsidian', {
	namedExports: { ButtonComponent, Modal, TextComponent },
	defaultExport: { ButtonComponent, Modal, TextComponent },
});

let NamedNoteModal: typeof import('./named-note-modal').NamedNoteModal;
const namedNoteModalReady = import('./named-note-modal').then((module) => {
	NamedNoteModal = module.NamedNoteModal;
});

type TestModal = {
	onOpen(): void;
	close(): void;
	closed: boolean;
	nameField: { input: TextComponent };
	cancelButton: ButtonComponent;
	submitButton: ButtonComponent;
	submit(): Promise<void>;
};

const config = {
	title: 'Title',
	description: 'Description',
	fieldLabel: 'Name',
	placeholder: 'Enter a name',
	submitLabel: 'Create',
};

async function openModal(onSubmit: (value: string) => Promise<boolean>): Promise<TestModal> {
	await namedNoteModalReady;
	const modal = new NamedNoteModal({} as never, config, onSubmit) as unknown as TestModal;
	modal.onOpen();
	return modal;
}

function keydown(
	modal: TestModal,
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
	for (const listener of modal.nameField.input.inputEl.listeners.get('keydown') ?? [])
		listener(event as never);
	return event;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((promiseResolve) => {
		resolve = promiseResolve;
	});
	return { promise, resolve };
}

test('Enter submits the current input value', async () => {
	const values: string[] = [];
	const modal = await openModal(async (value) => {
		values.push(value);
		return false;
	});
	modal.nameField.input.setValue('Arsenal');

	const event = keydown(modal, 'Enter');
	await setImmediate();

	deepStrictEqual(values, ['Arsenal']);
	strictEqual(event.defaultPrevented, true);
});

test('Enter during IME composition does not submit or prevent the default action', async () => {
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return false;
	});

	const event = keydown(modal, 'Enter', true);
	await setImmediate();

	strictEqual(submissions, 0);
	strictEqual(event.defaultPrevented, false);
});

test('non-Enter keys do not submit', async () => {
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return false;
	});

	const event = keydown(modal, 'Escape');
	await setImmediate();

	strictEqual(submissions, 0);
	strictEqual(event.defaultPrevented, false);
});

test('the keydown listener is removed when the modal closes', async () => {
	const modal = await openModal(async () => false);
	strictEqual(modal.nameField.input.inputEl.listeners.get('keydown')?.size, 1);

	modal.close();

	strictEqual(modal.nameField.input.inputEl.listeners.get('keydown')?.size, 0);
});

test('a second submission is ignored while the first submission is pending', async () => {
	const pending = deferred<boolean>();
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return pending.promise;
	});

	void modal.submit();
	void modal.submit();

	strictEqual(submissions, 1);
	pending.resolve(false);
	await setImmediate();
});

test('submit and cancel controls are disabled while pending and restored afterward', async () => {
	const pending = deferred<boolean>();
	const modal = await openModal(async () => pending.promise);

	void modal.submit();

	strictEqual(modal.submitButton.disabled, true);
	strictEqual(modal.cancelButton.disabled, true);
	pending.resolve(true);
	await setImmediate();
	strictEqual(modal.submitButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
});

test('closing is prevented while pending', async () => {
	const pending = deferred<boolean>();
	const modal = await openModal(async () => pending.promise);

	void modal.submit();
	modal.close();

	strictEqual(modal.closed, false);
	pending.resolve(false);
	await setImmediate();
});

test('controls restore when submission returns false and the modal remains open', async () => {
	const modal = await openModal(async () => false);

	await modal.submit();

	strictEqual(modal.closed, false);
	strictEqual(modal.submitButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
});

test('controls restore and the exact error is preserved when submission throws', async () => {
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
	strictEqual(modal.submitButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
});

test('the modal closes after true and remains open after false', async () => {
	const closes = await openModal(async () => true);
	await closes.submit();
	strictEqual(closes.closed, true);

	const staysOpen = await openModal(async () => false);
	await staysOpen.submit();
	strictEqual(staysOpen.closed, false);
});

test('button and Enter submissions share the same pending guard', async () => {
	const pending = deferred<boolean>();
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return pending.promise;
	});

	modal.submitButton.click();
	keydown(modal, 'Enter');

	strictEqual(submissions, 1);
	pending.resolve(false);
	await setImmediate();
});
