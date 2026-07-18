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
