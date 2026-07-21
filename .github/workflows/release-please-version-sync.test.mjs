import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const workflow = await readFile(
	new URL('./release-please-version-sync.yml', import.meta.url),
	'utf8',
);

function assertAppearsBefore(earlier, later) {
	const earlierIndex = workflow.indexOf(earlier);
	const laterIndex = workflow.indexOf(later);

	assert.notEqual(earlierIndex, -1, `Missing required workflow content: ${earlier}`);
	assert.notEqual(laterIndex, -1, `Missing required workflow content: ${later}`);
	assert.ok(earlierIndex < laterIndex, `${earlier} must appear before ${later}`);
}

function extractTrackedDiffValidationCommands(workflow) {
	const commands = workflow.match(
		/(git diff --no-ext-diff\n\s+git diff --cached --no-ext-diff\n\s+git diff --check\n\s+git diff --cached --check)/,
	)?.[1];

	assert.ok(
		commands,
		'The workflow must inspect and validate both unstaged and staged tracked diffs.',
	);
	return commands.replace(/^\s+/gm, '');
}

function createStagedDiffFixture(contents) {
	const directory = mkdtempSync(join(tmpdir(), 'release-please-version-sync-'));

	try {
		execFileSync('git', ['init', '--quiet'], { cwd: directory });
		execFileSync('git', ['config', 'user.email', 'fixture@example.test'], { cwd: directory });
		execFileSync('git', ['config', 'user.name', 'Fixture'], { cwd: directory });
		writeFileSync(join(directory, 'manifest.json'), '{"version":"0.2.0"}\n');
		execFileSync('git', ['add', 'manifest.json'], { cwd: directory });
		execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], { cwd: directory });
		writeFileSync(join(directory, 'versions.json'), contents);
		execFileSync('git', ['add', 'versions.json'], { cwd: directory });

		return directory;
	} catch (error) {
		rmSync(directory, { force: true, recursive: true });
		throw error;
	}
}

test('runs the release metadata synchronizer only from trusted immutable code', () => {
	assert.match(workflow, /vars\.RELEASE_PLEASE_APP_SLUG/);
	assert.match(workflow, /BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
	assert.match(workflow, /HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
	assert.match(workflow, /token: \$\{\{ github\.token \}\}/);
	assert.match(workflow, /persist-credentials: false/);
	assert.match(workflow, /git show "\$\{BASE_SHA\}:version-bump\.mjs"/);
	assert.match(workflow, /node "\$TRUSTED_SCRIPT" sync/);
	assert.match(workflow, /node "\$TRUSTED_SCRIPT" check/);
	assert.match(workflow, /git status --short/);
	assert.match(workflow, /git status --short --untracked-files=all --ignored/);
	assert.match(workflow, /git ls-files --others --ignored --exclude-standard/);
	assert.match(workflow, /git diff --name-only/);
	assert.match(workflow, /ls-remote origin "refs\/heads\/\$BRANCH"/);
	assert.match(workflow, /push HEAD:"\$BRANCH"/);
	assert.doesNotMatch(workflow, /npm ci/);
	assert.doesNotMatch(workflow, /npm run version:(sync|check)/);
	assert.doesNotMatch(workflow, /--force(?:-with-lease)?/);
	assert.match(workflow, /steps\.sync-version-metadata\.outputs\.has_changes == 'true'/);

	const appTokenStep = '- name: Generate GitHub App token for push';
	assertAppearsBefore('- uses: actions/checkout@v4', appTokenStep);
	assertAppearsBefore('node "$TRUSTED_SCRIPT" sync', appTokenStep);
	assertAppearsBefore('node "$TRUSTED_SCRIPT" check', appTokenStep);
	assertAppearsBefore('UNTRACKED_PATHS=', appTokenStep);
	assertAppearsBefore('CHANGED_PATHS=', appTokenStep);
	assertAppearsBefore('git commit -m "chore: sync release metadata"', appTokenStep);

	const allowlist = workflow.match(/case "\$path" in\s+([^)]*)\) ;;/)?.[1];
	assert.deepEqual(allowlist?.trim().split(/\s*\|\s*/), ['manifest.json', 'versions.json']);

	const pushCommands = [...workflow.matchAll(/^\s*git .* push\b.*$/gm)];
	assert.equal(pushCommands.length, 1);
	assert.match(pushCommands[0][0], /push HEAD:"\$BRANCH"$/);
	assertAppearsBefore('ls-remote origin "refs/heads/$BRANCH"', pushCommands[0][0].trim());
	assert.doesNotMatch(pushCommands[0][0], /--force(?:-with-lease)?/);
});

test('prints and validates unstaged and staged allowed tracked diffs before commit or token generation', () => {
	assert.match(workflow, /git diff --no-ext-diff/);
	assert.match(workflow, /git diff --cached --no-ext-diff/);
	assert.match(workflow, /git diff --check/);
	assert.match(workflow, /git diff --cached --check/);

	assertAppearsBefore('node "$TRUSTED_SCRIPT" sync', 'git diff --no-ext-diff');
	assertAppearsBefore('node "$TRUSTED_SCRIPT" check', 'git diff --no-ext-diff');
	assertAppearsBefore('case "$path" in', 'git diff --no-ext-diff');
	assertAppearsBefore('git diff --no-ext-diff', 'git diff --check');
	assertAppearsBefore('git diff --cached --no-ext-diff', 'git diff --check');
	assertAppearsBefore('git diff --check', 'git commit -m "chore: sync release metadata"');
	assertAppearsBefore(
		'git diff --cached --check',
		'git commit -m "chore: sync release metadata"',
	);
	assertAppearsBefore('git diff --check', '- name: Generate GitHub App token for push');
	assertAppearsBefore('git diff --cached --check', '- name: Generate GitHub App token for push');
});

test('staged-output fixture prints staged output and rejects staged whitespace errors', () => {
	const commands = extractTrackedDiffValidationCommands(workflow);
	const cleanDirectory = createStagedDiffFixture('{"version":"0.2.1"}\n');
	const invalidDirectory = createStagedDiffFixture('{"version":"0.2.1"}  \n');

	try {
		const output = execFileSync('bash', ['-c', commands], {
			cwd: cleanDirectory,
			encoding: 'utf8',
		});
		assert.match(output, /diff --git a\/versions\.json b\/versions\.json/);

		assert.throws(
			() =>
				execFileSync('bash', ['-c', commands], { cwd: invalidDirectory, encoding: 'utf8' }),
			(error) => {
				assert.match(error.stdout, /trailing whitespace/);
				return true;
			},
		);
	} finally {
		rmSync(cleanDirectory, { force: true, recursive: true });
		rmSync(invalidDirectory, { force: true, recursive: true });
	}
});
