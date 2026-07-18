import assert from 'node:assert/strict';
import test from 'node:test';

import {
	formatKnownCreateErrorNotice,
	formatUserFacingErrorNotice,
	UserFacingCreateError,
} from './user-facing-error';

void test('formatKnownCreateErrorNotice exposes safe create errors', () => {
	const message = formatKnownCreateErrorNotice(
		new Error(
			'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a folder.',
		),
		'Could not create team note. See console for details.',
		'Could not create team note',
	);

	assert.equal(
		message,
		'Could not create team note: Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a folder.',
	);
});

void test('formatKnownCreateErrorNotice keeps generic failures private', () => {
	const message = formatKnownCreateErrorNotice(
		new Error('vault unavailable'),
		'Could not create team note. See console for details.',
		'Could not create team note',
	);

	assert.equal(message, 'Could not create team note. See console for details.');
});

void test('formatUserFacingErrorNotice exposes typed create errors', () => {
	const error = new UserFacingCreateError(
		'Could not create team note because the destination already exists.',
	);

	assert.equal(error.name, 'UserFacingCreateError');
	assert.equal(
		formatUserFacingErrorNotice(error, 'Could not create team note. See console for details.'),
		error.message,
	);
});

void test('formatUserFacingErrorNotice hides misleading normal create errors', () => {
	const message = formatUserFacingErrorNotice(
		new Error('Cannot create team note because the destination already exists.'),
		'Could not create team note. See console for details.',
	);

	assert.equal(message, 'Could not create team note. See console for details.');
});

void test('formatUserFacingErrorNotice hides unknown non-Error values', () => {
	const message = formatUserFacingErrorNotice(
		{ message: 'Could not create team note because the destination already exists.' },
		'Could not create team note. See console for details.',
	);

	assert.equal(message, 'Could not create team note. See console for details.');
});
