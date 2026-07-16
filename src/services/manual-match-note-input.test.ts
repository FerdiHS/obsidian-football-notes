import assert from 'node:assert/strict';
import test from 'node:test';

import {
	normalizeManualMatchDate,
	normalizeManualMatchNoteWikiLinkTarget,
	normalizeRequiredManualMatchNoteField,
} from './manual-match-note-input';

void test('normalizeManualMatchDate accepts trimmed ISO dates', () => {
	assert.deepEqual(normalizeManualMatchDate(' 2026-07-01 '), {
		ok: true,
		value: '2026-07-01',
	});
});

void test('normalizeManualMatchDate rejects unsupported formats', () => {
	const result = normalizeManualMatchDate('tomorrow');

	assert.equal(result.ok, false);
	assert.equal(
		result.ok ? undefined : result.error.message,
		'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
	);
});

void test('normalizeManualMatchDate rejects impossible calendar dates', () => {
	const result = normalizeManualMatchDate('2026-02-31');

	assert.equal(result.ok, false);
	assert.equal(
		result.ok ? undefined : result.error.message,
		'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
	);
});

void test('normalizeManualMatchDate accepts leap-day dates only when valid', () => {
	assert.deepEqual(normalizeManualMatchDate('2024-02-29'), {
		ok: true,
		value: '2024-02-29',
	});

	const invalidLeapDay = normalizeManualMatchDate('2023-02-29');

	assert.equal(invalidLeapDay.ok, false);
	assert.equal(
		invalidLeapDay.ok ? undefined : invalidLeapDay.error.message,
		'Manual match note match date must use YYYY-MM-DD and be a valid calendar date.',
	);
});

void test('normalizeManualMatchNoteWikiLinkTarget rejects targets that normalize to empty', () => {
	const result = normalizeManualMatchNoteWikiLinkTarget('...', 'home team');

	assert.equal(result.ok, false);
	assert.equal(
		result.ok ? undefined : result.error.message,
		'Manual match note home team cannot become a valid wiki link target.',
	);
});

void test('normalizeRequiredManualMatchNoteField trims and rejects empty fields', () => {
	assert.deepEqual(normalizeRequiredManualMatchNoteField('  Real Madrid  ', 'home team'), {
		ok: true,
		value: 'Real Madrid',
	});

	const result = normalizeRequiredManualMatchNoteField('   ', 'away team');

	assert.equal(result.ok, false);
	assert.equal(
		result.ok ? undefined : result.error.message,
		'Manual match note away team cannot be empty.',
	);
});
