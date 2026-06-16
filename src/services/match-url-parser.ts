import type { MatchUrl } from '../types';

export type MatchUrlParseErrorCode =
	| 'empty-url'
	| 'invalid-url'
	| 'unsupported-url-scheme'
	| 'unsupported-url-auth';

export type MatchUrlParseResult =
	| {
			ok: true;
			value: MatchUrl;
	  }
	| {
			ok: false;
			error: {
				code: MatchUrlParseErrorCode;
				message: string;
			};
	  };

export function parseMatchUrl(input: string): MatchUrlParseResult {
	const trimmedInput = input.trim();

	if (trimmedInput.length === 0) {
		return createParseError('empty-url', 'Match URL cannot be empty.');
	}

	if (containsUnsupportedUrlCharacters(trimmedInput)) {
		return createParseError(
			'invalid-url',
			'Enter a valid match URL including http:// or https://.',
		);
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedInput);
	} catch {
		return createParseError(
			'invalid-url',
			'Enter a valid match URL including http:// or https://.',
		);
	}

	if (!isSupportedUrlScheme(parsedUrl)) {
		return createParseError(
			'unsupported-url-scheme',
			'Match URL must use http:// or https://.',
		);
	}

	if (!startsWithSupportedWebScheme(trimmedInput)) {
		return createParseError(
			'invalid-url',
			'Enter a valid match URL including http:// or https://.',
		);
	}

	if (parsedUrl.username.length > 0 || parsedUrl.password.length > 0) {
		return createParseError(
			'unsupported-url-auth',
			'Match URL cannot include embedded username or password.',
		);
	}

	return {
		ok: true,
		value: {
			sourceUrl: parsedUrl.href,
			sourceHost: parsedUrl.host,
		},
	};
}

function createParseError(code: MatchUrlParseErrorCode, message: string): MatchUrlParseResult {
	return {
		ok: false,
		error: {
			code,
			message,
		},
	};
}

function isSupportedUrlScheme(url: URL): boolean {
	return url.protocol === 'http:' || url.protocol === 'https:';
}

function startsWithSupportedWebScheme(input: string): boolean {
	return /^https?:\/\/[^/]/i.test(input);
}

function containsUnsupportedUrlCharacters(input: string): boolean {
	for (const character of input) {
		if (character === '\\') {
			return true;
		}

		const codePoint = character.codePointAt(0);

		if (
			codePoint !== undefined &&
			((codePoint >= 0x00 && codePoint <= 0x1f) || codePoint === 0x7f)
		) {
			return true;
		}
	}

	return false;
}
