import { sanitizeNoteTitle } from './note-title';

export interface ManualMatchNoteValidationSuccess<T> {
	ok: true;
	value: T;
}

export interface ManualMatchNoteValidationFailure {
	ok: false;
	error: {
		message: string;
	};
}

export type ManualMatchNoteValidationResult<T> =
	| ManualMatchNoteValidationSuccess<T>
	| ManualMatchNoteValidationFailure;

export function normalizeRequiredManualMatchNoteField(
	value: string,
	fieldName: string,
): ManualMatchNoteValidationResult<string> {
	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		return {
			ok: false,
			error: {
				message: `Manual match note ${fieldName} cannot be empty.`,
			},
		};
	}

	return {
		ok: true,
		value: trimmedValue,
	};
}

export function normalizeManualMatchDate(value: string): ManualMatchNoteValidationResult<string> {
	const trimmedValue = value.trim();

	if (trimmedValue.length === 0) {
		return {
			ok: false,
			error: {
				message: 'Manual match note match date cannot be empty.',
			},
		};
	}

	if (!/^\d{4}-\d{2}-\d{2}$/u.test(trimmedValue)) {
		return {
			ok: false,
			error: {
				message:
					'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
			},
		};
	}

	const [yearText, monthText, dayText] = trimmedValue.split('-');
	const year = Number(yearText);
	const month = Number(monthText);
	const day = Number(dayText);
	const candidateDate = new Date(Date.UTC(year, month - 1, day));

	if (
		candidateDate.getUTCFullYear() !== year ||
		candidateDate.getUTCMonth() + 1 !== month ||
		candidateDate.getUTCDate() !== day
	) {
		return {
			ok: false,
			error: {
				message:
					'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
			},
		};
	}

	return {
		ok: true,
		value: trimmedValue,
	};
}

export function normalizeManualMatchNoteWikiLinkTarget(
	value: string,
	fieldName: string,
): ManualMatchNoteValidationResult<string> {
	const normalizedTarget = value
		.trim()
		.replace(/[\\/:*?"<>|#^]/g, '-')
		.replace(/\s+/g, ' ')
		.replace(/[. ]+$/u, '')
		.replace(/\[/g, '-')
		.replace(/\]/g, '-');

	if (normalizedTarget.length === 0) {
		return {
			ok: false,
			error: {
				message: `Manual match note ${fieldName} cannot become a valid wiki link target.`,
			},
		};
	}

	return {
		ok: true,
		value: normalizedTarget,
	};
}

export function normalizeOptionalManualMatchNoteSourceUrl(
	value: string | undefined,
): string | undefined {
	const trimmedValue = value?.trim();

	return trimmedValue !== undefined && trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function validateManualMatchNoteTeamPathCollision(
	homeTeam: string,
	awayTeam: string,
): ManualMatchNoteValidationResult<void> {
	if (sanitizeNoteTitle(homeTeam) === sanitizeNoteTitle(awayTeam)) {
		return {
			ok: false,
			error: {
				message: 'Manual match note home and away teams must be different.',
			},
		};
	}

	return {
		ok: true,
		value: undefined,
	};
}
