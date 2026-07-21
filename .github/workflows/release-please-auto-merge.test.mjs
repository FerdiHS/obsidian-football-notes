import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflowPath = new URL('./release-please-auto-merge.yml', import.meta.url);

function skipUnavailableExecutableFixture(t, requiredBinaries) {
	const missingBinaries = requiredBinaries.filter((binary) => {
		const result = spawnSync(binary, ['--version'], { stdio: 'ignore' });
		return result.error !== undefined || result.status !== 0;
	});

	if (missingBinaries.length === 0) return false;

	t.skip(
		`Skipping executable fixture: required binary unavailable: ${missingBinaries.join(', ')}`,
	);
	return true;
}

function extractCheckSummaryFilter(workflow) {
	const filter = workflow.match(
		/CHECK_SUMMARY="\$\(jq -r --arg ORCHESTRATION_CHECK_NAME "\$ORCHESTRATION_CHECK_NAME" --arg INVALIDATION_CHECK_NAME "\$INVALIDATION_CHECK_NAME" '(.+)' <<< "\$PR_JSON"\)"/,
	)?.[1];

	assert.ok(filter, 'The workflow must run jq against the PR check rollup.');
	return filter;
}

function extractInvalidationJobName(workflow) {
	const jobName = workflow.match(/^\s{4}invalidate-stale-approval:\n\s{8}name:[ ](.+)$/m)?.[1];

	assert.ok(jobName, 'The invalidation job must have an exact check name.');
	return jobName;
}

function extractMergeJobName(workflow) {
	const jobName = workflow.match(/^\s{4}merge-release:\n\s{8}name:[ ](.+)$/m)?.[1];

	assert.ok(jobName, 'The merge job must have an exact check name.');
	return jobName;
}

function extractFailValidationHandler(workflow) {
	const handler = workflow.match(/^\s{18}fail_validation\(\) \{\n[\s\S]*?^\s{18}\}/m)?.[0];

	assert.ok(handler, 'The workflow must define its validation cleanup handler.');
	return handler.replace(/^\s{18}/gm, '');
}

function runFailValidationHandler(handler, editExitCode, commentExitCode) {
	const script = `
set -euo pipefail
gh() {
  printf '%s\\n' "$2"
  if [ "$2" = edit ]; then
    return "${editExitCode}"
  fi
  return "${commentExitCode}"
}
PR_URL=https://example.test/release
${handler}
fail_validation 'validation failed'
`;

	try {
		return {
			calls: execFileSync('bash', ['-c', script], { encoding: 'utf8' }).trim().split('\n'),
			status: 0,
		};
	} catch (error) {
		return {
			calls: error.stdout.toString().trim().split('\n'),
			status: error.status,
		};
	}
}

function runCheckSummaryFilter(filter, orchestrationCheckName, invalidationCheckName, fixture) {
	return execFileSync(
		'jq',
		[
			'-r',
			'--arg',
			'ORCHESTRATION_CHECK_NAME',
			orchestrationCheckName,
			'--arg',
			'INVALIDATION_CHECK_NAME',
			invalidationCheckName,
			filter,
		],
		{ encoding: 'utf8', input: JSON.stringify(fixture) },
	)
		.trim()
		.split('\t');
}

test('release merge workflow excludes both Approval Gate checks from external check counts', async () => {
	const workflow = await readFile(workflowPath, 'utf8');
	const orchestrationCheckName = extractMergeJobName(workflow);
	const invalidationCheckName = extractInvalidationJobName(workflow);
	assert.match(workflow, new RegExp(`ORCHESTRATION_CHECK_NAME: ${orchestrationCheckName}`));
	assert.match(workflow, new RegExp(`INVALIDATION_CHECK_NAME: ${invalidationCheckName}`));
	assert.match(
		workflow,
		/statusCheckRollup.*\.name != \$ORCHESTRATION_CHECK_NAME.*\.context != \$INVALIDATION_CHECK_NAME/s,
	);
	assert.match(workflow, /\.conclusion == "SUCCESS".*\.state == "SUCCESS"/s);
	assert.match(workflow, /build \(20\.x\)/);
	assert.match(workflow, /build \(22\.x\)/);
});

test('release merge workflow executes its jq filter for internal-only and external check states', async (t) => {
	const workflow = await readFile(workflowPath, 'utf8');
	const filter = extractCheckSummaryFilter(workflow);
	const orchestrationCheckName = extractMergeJobName(workflow);
	const invalidationCheckName = extractInvalidationJobName(workflow);
	if (skipUnavailableExecutableFixture(t, ['jq'])) return;
	const baseFixture = {
		baseRefName: 'main',
		headRefOid: 'head',
		isDraft: false,
	};

	for (const { name, statusCheckRollup, expected } of [
		{
			name: 'internal Approval Gate checks only',
			statusCheckRollup: [
				{ name: orchestrationCheckName, state: 'IN_PROGRESS' },
				{ conclusion: 'SUCCESS', name: invalidationCheckName },
			],
			expected: ['head', 'main', 'false', '0', '0', '2'],
		},
		{
			name: 'successful external CheckRun',
			statusCheckRollup: [{ conclusion: 'SUCCESS', name: 'build' }],
			expected: ['head', 'main', 'false', '1', '0', '2'],
		},
		{
			name: 'successful external StatusContext',
			statusCheckRollup: [{ context: 'legacy-ci', state: 'SUCCESS' }],
			expected: ['head', 'main', 'false', '1', '0', '2'],
		},
		{
			name: 'pending CheckRun',
			statusCheckRollup: [{ name: 'build', state: 'IN_PROGRESS' }],
			expected: ['head', 'main', 'false', '1', '1', '2'],
		},
		{
			name: 'failed StatusContext',
			statusCheckRollup: [{ context: 'legacy-ci', state: 'FAILURE' }],
			expected: ['head', 'main', 'false', '1', '1', '2'],
		},
		{
			name: 'skipped CheckRun',
			statusCheckRollup: [{ conclusion: 'SKIPPED', name: 'build' }],
			expected: ['head', 'main', 'false', '1', '1', '2'],
		},
		{
			name: 'empty rollup',
			statusCheckRollup: [],
			expected: ['head', 'main', 'false', '0', '0', '2'],
		},
	]) {
		assert.deepEqual(
			runCheckSummaryFilter(filter, orchestrationCheckName, invalidationCheckName, {
				...baseFixture,
				statusCheckRollup,
			}),
			expected,
			name,
		);
	}
});

test('release merge workflow blocks when the expected CI matrix checks are absent', async (t) => {
	const workflow = await readFile(workflowPath, 'utf8');
	const filter = extractCheckSummaryFilter(workflow);
	const orchestrationCheckName = extractMergeJobName(workflow);
	const invalidationCheckName = extractInvalidationJobName(workflow);
	if (skipUnavailableExecutableFixture(t, ['jq'])) return;

	assert.deepEqual(
		runCheckSummaryFilter(filter, orchestrationCheckName, invalidationCheckName, {
			baseRefName: 'main',
			headRefOid: 'head',
			isDraft: false,
			statusCheckRollup: [{ conclusion: 'SUCCESS', name: 'unrelated-check' }],
		}),
		['head', 'main', 'false', '1', '0', '2'],
	);
});

test('release merge workflow waits for a successful invalidation sibling and excludes both Approval Gate checks', async (t) => {
	const workflow = await readFile(workflowPath, 'utf8');
	const filter = extractCheckSummaryFilter(workflow);
	const orchestrationCheckName = extractMergeJobName(workflow);
	const invalidationCheckName = extractInvalidationJobName(workflow);

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
	if (skipUnavailableExecutableFixture(t, ['jq'])) return;

	const baseFixture = {
		baseRefName: 'main',
		headRefOid: 'head',
		isDraft: false,
	};
	const successfulRollup = [
		{ name: orchestrationCheckName, state: 'IN_PROGRESS' },
		{ conclusion: 'SUCCESS', name: 'build (20.x)' },
		{ context: 'build (22.x)', state: 'SUCCESS' },
		{ conclusion: 'SUCCESS', name: invalidationCheckName },
	];

	assert.deepEqual(
		runCheckSummaryFilter(filter, orchestrationCheckName, invalidationCheckName, {
			...baseFixture,
			statusCheckRollup: successfulRollup,
		}),
		['head', 'main', 'false', '2', '0', '0'],
	);
	assert.deepEqual(
		runCheckSummaryFilter(filter, orchestrationCheckName, invalidationCheckName, {
			...baseFixture,
			statusCheckRollup: [
				...successfulRollup.slice(0, 1),
				{ conclusion: 'FAILURE', name: 'build (20.x)' },
				...successfulRollup.slice(2),
			],
		}),
		['head', 'main', 'false', '2', '1', '1'],
	);
});

test('release merge workflow reports validation-cleanup failures after attempting both operations', async (t) => {
	if (skipUnavailableExecutableFixture(t, ['bash'])) return;
	const handler = extractFailValidationHandler(await readFile(workflowPath, 'utf8'));

	for (const { editExitCode, commentExitCode, status } of [
		{ commentExitCode: 0, editExitCode: 0, status: 0 },
		{ commentExitCode: 0, editExitCode: 1, status: 1 },
		{ commentExitCode: 1, editExitCode: 0, status: 1 },
	]) {
		assert.deepEqual(runFailValidationHandler(handler, editExitCode, commentExitCode), {
			calls: ['edit', 'comment'],
			status,
		});
	}
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
	assert.match(workflow, /INVALIDATION_CHECK_NAME/);
	assert.match(workflow, /\.name != \$ORCHESTRATION_CHECK_NAME/);
	assert.match(workflow, /\.name != \$INVALIDATION_CHECK_NAME/);
	assert.match(workflow, /EXTERNAL_CHECK_COUNT.*-eq 0/);
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
