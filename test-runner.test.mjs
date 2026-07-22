import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { collectTestFiles } from './test-runner.mjs';

const launcherPath = fileURLToPath(new URL('./test-runner.mjs', import.meta.url));

function writeFixture(root, relativePath, contents) {
	const fullPath = join(root, relativePath);
	mkdirSync(dirname(fullPath), { recursive: true });
	writeFileSync(fullPath, contents);
}

test('collectTestFiles returns sorted repo-relative supported tests', () => {
	const root = mkdtempSync(join(tmpdir(), 'football-notes-test-runner-'));
	try {
		writeFixture(
			root,
			'.github/workflows/b.test.mjs',
			"import test from 'node:test'; test('b', () => {});",
		);
		writeFixture(root, 'src/b.test.ts', "import test from 'node:test'; test('b', () => {});");
		writeFixture(root, 'src/a.test.ts', "import test from 'node:test'; test('a', () => {});");
		writeFixture(root, 'src/ui/named-note-modal-test-support.ts', 'export {};');
		writeFixture(
			root,
			'node_modules/ignored.test.ts',
			"import test from 'node:test'; test('ignored', () => {});",
		);

		assert.deepEqual(collectTestFiles(root), [
			'.github/workflows/b.test.mjs',
			'src/a.test.ts',
			'src/b.test.ts',
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('launcher returns non-zero when a discovered test fails', () => {
	const root = mkdtempSync(join(tmpdir(), 'football-notes-test-runner-'));
	try {
		writeFixture(root, 'pass.test.ts', "import test from 'node:test'; test('pass', () => {});");
		writeFixture(
			root,
			'fail.test.ts',
			"import assert from 'node:assert/strict'; import test from 'node:test'; test('fail', () => assert.fail('boom'));",
		);

		const result = spawnSync(process.execPath, [launcherPath], {
			cwd: root,
			encoding: 'utf8',
		});

		assert.notEqual(result.status, 0);
		assert.match(result.stderr, /boom/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});
