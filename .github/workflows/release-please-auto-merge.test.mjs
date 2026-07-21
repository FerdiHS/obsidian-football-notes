import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('./release-please-auto-merge.yml', import.meta.url);

function extractCheckSummaryFilter(workflow) {
	const filter = workflow.match(
		/CHECK_SUMMARY="\$\(jq -r --arg ORCHESTRATION_CHECK_NAME "\$ORCHESTRATION_CHECK_NAME" '(.+)' <<< "\$PR_JSON"\)"/,
	)?.[1];

	assert.ok(filter, 'The workflow must run jq against the PR check rollup.');
	return filter;
}

function extractMergeJobName(workflow) {
	const jobName = workflow.match(/^\s{4}merge-release:\n\s{8}name:[ ](.+)$/m)?.[1];

	assert.ok(jobName, 'The merge job must have an exact check name.');
	return jobName;
}

function runCheckSummaryFilter(filter, orchestrationCheckName, fixture) {
	return execFileSync(
		'jq',
		['-r', '--arg', 'ORCHESTRATION_CHECK_NAME', orchestrationCheckName, filter],
		{ encoding: 'utf8', input: JSON.stringify(fixture) },
	)
		.trim()
		.split('\t');
}

test('release merge workflow excludes its exact orchestration check from both check counts', async () => {
	const workflow = await readFile(workflowPath, 'utf8');
	const orchestrationCheckName = extractMergeJobName(workflow);
	assert.match(workflow, new RegExp(`ORCHESTRATION_CHECK_NAME: ${orchestrationCheckName}`));
	assert.match(
		workflow,
		/\(\[\.statusCheckRollup\[\]\s*\|\s*select\(\.name != \$ORCHESTRATION_CHECK_NAME and \.context != \$ORCHESTRATION_CHECK_NAME\)\]\s*\|\s*length\)/,
	);
	assert.match(
		workflow,
		/\(\[\.statusCheckRollup\[\]\s*\|\s*select\(\.name != \$ORCHESTRATION_CHECK_NAME and \.context != \$ORCHESTRATION_CHECK_NAME and \(\(\(\.conclusion == "SUCCESS"\) or \(\.state == "SUCCESS"\)\) \| not\)\)\]\s*\|\s*length\)/,
	);
});

test('release merge workflow executes its jq filter for every external check state', async () => {
	const workflow = await readFile(workflowPath, 'utf8');
	const filter = extractCheckSummaryFilter(workflow);
	const orchestrationCheckName = extractMergeJobName(workflow);
	const baseFixture = {
		baseRefName: 'main',
		headRefOid: 'head',
		isDraft: false,
	};

	for (const { name, statusCheckRollup, expected } of [
		{
			name: 'successful CheckRun and StatusContext',
			statusCheckRollup: [
				{ conclusion: 'SUCCESS', name: 'build' },
				{ context: 'legacy-ci', state: 'SUCCESS' },
			],
			expected: ['head', 'main', 'false', '2', '0'],
		},
		{
			name: 'pending CheckRun',
			statusCheckRollup: [{ name: 'build', state: 'IN_PROGRESS' }],
			expected: ['head', 'main', 'false', '1', '1'],
		},
		{
			name: 'failed StatusContext',
			statusCheckRollup: [{ context: 'legacy-ci', state: 'FAILURE' }],
			expected: ['head', 'main', 'false', '1', '1'],
		},
		{
			name: 'skipped CheckRun',
			statusCheckRollup: [{ conclusion: 'SKIPPED', name: 'build' }],
			expected: ['head', 'main', 'false', '1', '1'],
		},
		{
			name: 'empty rollup',
			statusCheckRollup: [],
			expected: ['head', 'main', 'false', '0', '0'],
		},
	]) {
		assert.deepEqual(
			runCheckSummaryFilter(filter, orchestrationCheckName, {
				...baseFixture,
				statusCheckRollup,
			}),
			expected,
			name,
		);
	}
});

test('release merge workflow waits for a successful invalidation sibling and ignores only itself', async () => {
	const workflow = await readFile(workflowPath, 'utf8');
	const filter = extractCheckSummaryFilter(workflow);
	const orchestrationCheckName = extractMergeJobName(workflow);

	assert.match(
		workflow,
		/invalidate-stale-approval:\n\s{8}name: Release Please Approval Invalidation/,
	);
	assert.match(
		workflow,
		/merge-release:\n\s{8}name: Release Please Merge Orchestration\n\s{8}needs: invalidate-stale-approval/,
	);
	assert.match(
		workflow,
		/Remove stale approval label\n\s{14}if: >\n\s{18}\(\n\s{22}github\.event\.action == 'synchronize' \|\|\n\s{22}github\.event\.action == 'converted_to_draft'/,
	);

	const baseFixture = {
		baseRefName: 'main',
		headRefOid: 'head',
		isDraft: false,
	};
	const successfulRollup = [
		{ name: orchestrationCheckName, state: 'IN_PROGRESS' },
		{ conclusion: 'SUCCESS', name: 'build' },
		{ context: 'legacy-ci', state: 'SUCCESS' },
		{ conclusion: 'SUCCESS', name: 'Release Please Approval Invalidation' },
	];

	assert.deepEqual(
		runCheckSummaryFilter(filter, orchestrationCheckName, {
			...baseFixture,
			statusCheckRollup: successfulRollup,
		}),
		['head', 'main', 'false', '3', '0'],
	);
	assert.deepEqual(
		runCheckSummaryFilter(filter, orchestrationCheckName, {
			...baseFixture,
			statusCheckRollup: [
				...successfulRollup.slice(0, 1),
				{ conclusion: 'FAILURE', name: 'build' },
				...successfulRollup.slice(2),
			],
		}),
		['head', 'main', 'false', '3', '1'],
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
