export class TestElement {
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

export class Modal {
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

export class ButtonComponent {
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

export class TextComponent {
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
