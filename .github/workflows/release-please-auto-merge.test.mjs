import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('./release-please-auto-merge.yml', import.meta.url);

test('release merge workflow excludes its exact orchestration check from both check counts', async () => {
	const workflow = await readFile(workflowPath, 'utf8');
	const workflowName = workflow.match(/^name:[ ](.+)$/m)?.[1];
	const jobName = workflow.match(/^\s{4}merge-release:\n\s{8}name:[ ](.+)$/m)?.[1];

	assert.ok(workflowName);
	assert.ok(jobName);

	const orchestrationCheckName = `${workflowName} / ${jobName}`;
	assert.match(workflow, new RegExp(`ORCHESTRATION_CHECK_NAME: ${orchestrationCheckName}`));
	assert.match(
		workflow,
		/\(\[\.statusCheckRollup\[\]\s*\|\s*select\(\.name != \$ORCHESTRATION_CHECK_NAME\)\]\s*\|\s*length\)/,
	);
	assert.match(
		workflow,
		/\(\[\.statusCheckRollup\[\]\s*\|\s*select\(\.name != \$ORCHESTRATION_CHECK_NAME and !\(\(\.conclusion == "SUCCESS"\) or \(\.state == "SUCCESS"\)\)\)\]\s*\|\s*length\)/,
	);
});

test('release merge workflow uses exact-head label-triggered merging', async () => {
	const workflow = await readFile(workflowPath, 'utf8');

	assert.match(workflow, /- labeled\n\s+- synchronize\n\s+- converted_to_draft/);
	assert.doesNotMatch(workflow, /- unlabeled\n|- ready_for_review\n/);
	assert.match(workflow, /github\.actor/);
	assert.match(workflow, /github\.event\.label\.name == 'release: ready'/);
	assert.match(workflow, /headRefOid/);
	assert.match(workflow, /baseRefName/);
	assert.match(workflow, /PR_BASE.*!= "main"/);
	assert.match(workflow, /statusCheckRollup/);
	assert.match(workflow, /ORCHESTRATION_CHECK_NAME/);
	assert.match(workflow, /\.name != \$ORCHESTRATION_CHECK_NAME/);
	assert.match(workflow, /CHECK_COUNT.*-eq 0/);
	assert.match(workflow, /\.conclusion == "SUCCESS"/);
	assert.match(workflow, /\.state == "SUCCESS"/);
	assert.doesNotMatch(workflow, /\.status\s*[!=]=?\s*"SUCCESS"/);
	assert.match(workflow, /--match-head-commit/);
	assert.match(workflow, /gh pr edit[\s\S]*--remove-label/);
	assert.match(workflow, /gh pr comment/);
	assert.match(workflow, /Release merge failed[\s\S]*exit 1/);

	for (const forbiddenFlag of ['--auto', '--admin', '--disable-auto', '--force', '--required']) {
		assert.doesNotMatch(workflow, new RegExp(`\\${forbiddenFlag}(?:\\s|["'])`));
	}
});
