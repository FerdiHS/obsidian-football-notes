import assert from 'node:assert/strict';
import test from 'node:test';

import { parseMatchUrl, type MatchUrlParseErrorCode } from './match-url-parser';
import type { MatchUrl } from '../types';

void test('parseMatchUrl normalizes a valid HTTP(S) match URL', () => {
	const value = expectParseSuccess(' HTTPS://EXAMPLE.COM/match ');

	assert.deepEqual(value, {
		sourceUrl: 'https://example.com/match',
		sourceHost: 'example.com',
	});
});

void test('parseMatchUrl rejects unsupported URL schemes', () => {
	expectParseError('ftp://example.com/match', 'unsupported-url-scheme');
});

void test('parseMatchUrl rejects malformed raw whitespace and backslashes', async (t) => {
	await t.test('embedded spaces', () => {
		expectParseError('https://example.com/match 123', 'invalid-url');
	});

	await t.test('tab characters', () => {
		expectParseError('https://example.com/match\t123', 'invalid-url');
	});

	await t.test('newline characters', () => {
		expectParseError('https://example.com/match\n123', 'invalid-url');
	});

	await t.test('backslashes', () => {
		expectParseError('https://\\example.com/match', 'invalid-url');
	});
});

void test('parseMatchUrl rejects embedded username or password', async (t) => {
	await t.test('empty userinfo delimiter', () => {
		expectParseError('https://@example.com/match', 'unsupported-url-auth');
	});

	await t.test('empty userinfo with password delimiter', () => {
		expectParseError('https://:@example.com/match', 'unsupported-url-auth');
	});

	await t.test('username auth', () => {
		expectParseError('https://user@example.com/match', 'unsupported-url-auth');
	});

	await t.test('username and password auth', () => {
		expectParseError('https://user:pass@example.com/match', 'unsupported-url-auth');
	});
});

void test('parseMatchUrl accepts @ outside the URL authority', async (t) => {
	await t.test('path segment', () => {
		const value = expectParseSuccess('https://example.com/@club/match');

		assert.equal(value.sourceUrl, 'https://example.com/@club/match');
	});

	await t.test('query string', () => {
		const value = expectParseSuccess('https://example.com/match?team=@club');

		assert.equal(value.sourceUrl, 'https://example.com/match?team=@club');
	});
});

void test('parseMatchUrl preserves already encoded spaces', () => {
	const value = expectParseSuccess('https://example.com/match%20123');

	assert.deepEqual(value, {
		sourceUrl: 'https://example.com/match%20123',
		sourceHost: 'example.com',
	});
});

function expectParseSuccess(input: string): MatchUrl {
	const result = parseMatchUrl(input);

	assert.equal(result.ok, true, `Expected parse success for ${JSON.stringify(input)}.`);

	if (!result.ok) {
		throw new Error(`Expected parse success for ${JSON.stringify(input)}.`);
	}

	return result.value;
}

function expectParseError(input: string, code: MatchUrlParseErrorCode): void {
	const result = parseMatchUrl(input);

	assert.equal(result.ok, false, `Expected parse error for ${JSON.stringify(input)}.`);

	if (result.ok) {
		throw new Error(`Expected parse error for ${JSON.stringify(input)}.`);
	}

	assert.equal(result.error.code, code);
}
