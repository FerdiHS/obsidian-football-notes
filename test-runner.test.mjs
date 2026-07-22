import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { collectTestFiles, run } from './test-runner.mjs';

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
		writeFixture(
			root,
			'.git/ignored.test.ts',
			"import test from 'node:test'; test('ignored', () => {});",
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
		writeFixture(
			root,
			'node_modules/jiti/package.json',
			JSON.stringify({
				name: 'jiti',
				exports: {
					'./register': './register.mjs',
				},
			}),
		);
		writeFixture(root, 'node_modules/jiti/register.mjs', 'export {};');
		writeFixture(
			root,
			'pass.test.mjs',
			"import test from 'node:test'; test('pass', () => {});",
		);
		writeFixture(
			root,
			'fail.test.mjs',
			"import assert from 'node:assert/strict'; import test from 'node:test'; test('fail', () => assert.fail('boom'));",
		);

		const result = spawnSync(process.execPath, [launcherPath], {
			cwd: root,
			encoding: 'utf8',
		});

		assert.notEqual(result.status, 0);
		assert.match(`${result.stdout}${result.stderr}`, /boom/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('run preserves the exact child test command and inherits stdio', () => {
	const root = mkdtempSync(join(tmpdir(), 'football-notes-test-runner-'));
	try {
		writeFixture(
			root,
			'nested/sample.test.ts',
			"import test from 'node:test'; test('ok', () => {});",
		);

		const calls = [];
		const proc = {
			cwd: () => root,
			env: { ...process.env },
			execPath: '/usr/local/bin/node',
			exit(code) {
				throw new Error(`exit:${code}`);
			},
		};

		assert.throws(
			() =>
				run({
					proc,
					spawn: (...args) => {
						calls.push(args);
						return { status: 0 };
					},
				}),
			/exit:0/,
		);

		const expectedEnv = { ...process.env };
		delete expectedEnv.NODE_TEST_CONTEXT;

		assert.equal(calls.length, 1);
		assert.deepEqual(calls[0], [
			'/usr/local/bin/node',
			['--import', 'jiti/register', '--test', join(root, 'nested/sample.test.ts')],
			{
				env: expectedEnv,
				stdio: 'inherit',
			},
		]);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('run exits without spawning when no tests are discovered', () => {
	const root = mkdtempSync(join(tmpdir(), 'football-notes-test-runner-'));
	try {
		let spawnCalled = false;
		const stderr = [];
		const proc = {
			cwd: () => root,
			env: { ...process.env },
			execPath: '/usr/local/bin/node',
			exit(code) {
				throw new Error(`exit:${code}`);
			},
			stderr: {
				write(chunk) {
					stderr.push(chunk);
				},
			},
		};

		assert.throws(
			() =>
				run({
					proc,
					spawn: () => {
						spawnCalled = true;
						return { status: 0 };
					},
				}),
			/exit:1/,
		);

		assert.equal(spawnCalled, false);
		assert.match(stderr.join(''), /No test files found/);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('package.json test script points at the launcher', () => {
	const packageJson = JSON.parse(
		readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
	);
	assert.equal(packageJson.scripts.test, 'node test-runner.mjs');
});
