import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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

test('prints and validates the complete allowed tracked diff before commit or token generation', () => {
	assert.match(workflow, /git diff --no-ext-diff/);
	assert.match(workflow, /git diff --check/);

	assertAppearsBefore('node "$TRUSTED_SCRIPT" sync', 'git diff --no-ext-diff');
	assertAppearsBefore('node "$TRUSTED_SCRIPT" check', 'git diff --no-ext-diff');
	assertAppearsBefore('case "$path" in', 'git diff --no-ext-diff');
	assertAppearsBefore('git diff --no-ext-diff', 'git diff --check');
	assertAppearsBefore('git diff --check', 'git commit -m "chore: sync release metadata"');
	assertAppearsBefore('git diff --check', '- name: Generate GitHub App token for push');
});
