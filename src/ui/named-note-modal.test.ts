import { deepStrictEqual, strictEqual } from 'node:assert';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createJiti } from 'jiti';
import { ButtonComponent, TextComponent } from './named-note-modal-test-support';

let NamedNoteModal: typeof import('./named-note-modal').NamedNoteModal;
const namedNoteModalReady = createJiti(import.meta.url, {
	alias: {
		obsidian: fileURLToPath(new URL('./named-note-modal-test-support.ts', import.meta.url)),
	},
	moduleCache: false,
	fsCache: false,
})
	.import<typeof import('./named-note-modal')>('./named-note-modal')
	.then((module) => {
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

void test('Enter submits the current input value', async () => {
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

void test('Enter during IME composition does not submit or prevent the default action', async () => {
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

void test('non-Enter keys do not submit', async () => {
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

void test('the keydown listener is removed when the modal closes', async () => {
	const modal = await openModal(async () => false);
	strictEqual(modal.nameField.input.inputEl.listeners.get('keydown')?.size, 1);

	modal.close();

	strictEqual(modal.nameField.input.inputEl.listeners.get('keydown')?.size, 0);
});

void test('a second submission is ignored while the first submission is pending', async () => {
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

void test('submit and cancel controls are disabled while pending and restored afterward', async () => {
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

void test('closing is prevented while pending', async () => {
	const pending = deferred<boolean>();
	const modal = await openModal(async () => pending.promise);

	void modal.submit();
	modal.close();

	strictEqual(modal.closed, false);
	pending.resolve(false);
	await setImmediate();
});

void test('controls restore when submission returns false and the modal remains open', async () => {
	const modal = await openModal(async () => false);

	await modal.submit();

	strictEqual(modal.closed, false);
	strictEqual(modal.submitButton.disabled, false);
	strictEqual(modal.cancelButton.disabled, false);
});

void test('controls restore and the exact error is preserved when submission throws', async () => {
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

void test('the modal closes after true and remains open after false', async () => {
	const closes = await openModal(async () => true);
	await closes.submit();
	strictEqual(closes.closed, true);

	const staysOpen = await openModal(async () => false);
	await staysOpen.submit();
	strictEqual(staysOpen.closed, false);
});

void test('button and Enter submissions share the same pending guard', async () => {
	const pending = deferred<boolean>();
	let submissions = 0;
	const modal = await openModal(async () => {
		submissions++;
		return pending.promise;
	});

	modal.submitButton.click();
	strictEqual(submissions, 1);
	keydown(modal, 'Enter');

	strictEqual(submissions, 1);
	pending.resolve(false);
	await setImmediate();
});
