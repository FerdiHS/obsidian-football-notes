import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { env, execPath } from 'node:process';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./version-bump.mjs', import.meta.url));

function createFixture({ packageVersion, manifestContents, versionsContents }) {
	const directory = mkdtempSync(join(tmpdir(), 'football-notes-version-bump-'));

	writeFileSync(
		join(directory, 'package.json'),
		`${JSON.stringify({ name: 'football-notes', version: packageVersion }, null, '\t')}\n`,
	);
	writeFileSync(join(directory, 'manifest.json'), manifestContents);
	writeFileSync(join(directory, 'versions.json'), versionsContents);

	return directory;
}

function runSync(directory) {
	execFileSync(execPath, [scriptPath, 'sync'], {
		cwd: directory,
		env: {
			...env,
			GITHUB_HEAD_REF: 'release-please--branches--main--components--football-notes',
		},
	});
}

test('updates only versions.json when the manifest version is already current', () => {
	const manifestContents = '{"version":"0.3.0","minAppVersion":"0.15.0"}\n';
	const directory = createFixture({
		packageVersion: '0.3.0',
		manifestContents,
		versionsContents: '{"0.2.0":"0.15.0"}\n',
	});

	try {
		runSync(directory);

		assert.equal(readFileSync(join(directory, 'manifest.json'), 'utf8'), manifestContents);

		const versionsContents = readFileSync(join(directory, 'versions.json'), 'utf8');
		assert.equal(JSON.parse(versionsContents)['0.3.0'], '0.15.0');
		assert.ok(versionsContents.endsWith('\n'));
	} finally {
		rmSync(directory, { force: true, recursive: true });
	}
});

test('updates only manifest.json when the release entry is already current', () => {
	const versionsContents = '{"0.3.0":"0.15.0"}\n';
	const directory = createFixture({
		packageVersion: '0.3.0',
		manifestContents: '{"version":"0.2.0","minAppVersion":"0.15.0"}\n',
		versionsContents,
	});

	try {
		runSync(directory);

		assert.equal(readFileSync(join(directory, 'versions.json'), 'utf8'), versionsContents);

		const manifestContents = readFileSync(join(directory, 'manifest.json'), 'utf8');
		assert.equal(JSON.parse(manifestContents).version, '0.3.0');
		assert.ok(manifestContents.endsWith('\n'));
	} finally {
		rmSync(directory, { force: true, recursive: true });
	}
});
