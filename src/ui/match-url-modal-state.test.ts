import assert from 'node:assert/strict';
import test from 'node:test';

import { canCloseMatchUrlModal } from './match-url-modal-state';

void test('canCloseMatchUrlModal blocks dismissal while submitting', () => {
	assert.equal(canCloseMatchUrlModal(true), false);
	assert.equal(canCloseMatchUrlModal(false), true);
});
