import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('./release-please-auto-merge.yml', import.meta.url);

test('release merge workflow uses exact-head label-triggered merging', async () => {
	const workflow = await readFile(workflowPath, 'utf8');

	assert.match(workflow, /- labeled\n\s+- synchronize\n\s+- converted_to_draft/);
	assert.doesNotMatch(workflow, /- unlabeled\n|- ready_for_review\n/);
	assert.match(workflow, /github\.actor/);
	assert.match(workflow, /github\.event\.label\.name == 'release: ready'/);
	assert.match(workflow, /headRefOid/);
	assert.match(workflow, /statusCheckRollup/);
	assert.match(workflow, /CHECK_COUNT.*-eq 0/);
	assert.match(workflow, /\.conclusion == "SUCCESS"/);
	assert.match(workflow, /\.state == "SUCCESS"/);
	assert.doesNotMatch(workflow, /\.status\s*[!=]=?\s*"SUCCESS"/);
	assert.match(workflow, /--match-head-commit/);
	assert.match(workflow, /gh pr edit[\s\S]*--remove-label/);
	assert.match(workflow, /gh pr comment/);

	for (const forbiddenFlag of ['--auto', '--admin', '--disable-auto', '--force', '--required']) {
		assert.doesNotMatch(workflow, new RegExp(`\\${forbiddenFlag}(?:\\s|["'])`));
	}
});
