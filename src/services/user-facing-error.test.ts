import assert from 'node:assert/strict';
import test from 'node:test';

import { formatKnownCreateErrorNotice } from './user-facing-error';

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
