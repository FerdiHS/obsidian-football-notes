import assert from 'node:assert/strict';
import test from 'node:test';

import { formatUserFacingErrorNotice, UserFacingCreateError } from './user-facing-error';

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
