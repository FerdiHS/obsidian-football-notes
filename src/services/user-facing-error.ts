export class UserFacingCreateError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UserFacingCreateError';
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export function formatUserFacingErrorNotice(error: unknown, fallbackMessage: string): string {
	return error instanceof UserFacingCreateError ? error.message : fallbackMessage;
}

export function formatKnownCreateErrorNotice(
	error: unknown,
	fallbackMessage: string,
	prefix: string,
): string {
	const message = getKnownCreateErrorMessage(error);

	if (message === null) {
		return fallbackMessage;
	}

	return message.startsWith(prefix) ? message : `${prefix}: ${message}`;
}

function getKnownCreateErrorMessage(error: unknown): string | null {
	if (!(error instanceof Error)) {
		return null;
	}

	if (
		error.message.startsWith('Cannot create ') ||
		error.message.startsWith('Could not create ')
	) {
		return error.message;
	}

	return null;
}
