import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(
	new URL('./release-please-version-sync.yml', import.meta.url),
	'utf8',
);

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
});
