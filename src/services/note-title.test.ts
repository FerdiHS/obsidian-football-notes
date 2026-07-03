import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeNoteTitle } from './note-title';

void test('normalizeNoteTitle sanitizes wiki-link-sensitive characters', () => {
	assert.equal(normalizeNoteTitle('Foo#Bar'), 'Foo-Bar');
	assert.equal(normalizeNoteTitle('Baz^Qux'), 'Baz-Qux');
});

void test('normalizeNoteTitle preserves ordinary titles and trims whitespace', () => {
	assert.equal(normalizeNoteTitle('  Real Madrid  '), 'Real Madrid');
	assert.equal(normalizeNoteTitle('New match note'), 'New match note');
});
