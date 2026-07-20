---
name: football-notes-pr-review
description: Use when reviewing a Football Notes pull request or branch against its complete pull-request change set and applicable issue requirements. Do not use for implementation, planning, CI-only debugging, existing review-comment follow-up, release-only work, or unrelated repositories.
---

# Football Notes pull-request review

Read [`AGENTS.md`](../../../AGENTS.md) first. It is the source of repository invariants; do not repeat its full contents in the review.

Explicit invocation is the reliable path:

```text
$football-notes-pr-review Review PR 55 and verify Issue 52.
```

Natural-language selection is best-effort.

## Read-only boundary

A review request is read-only by default. It does not authorize:

- editing tracked repository files;
- staging, committing, pushing, rebasing, or modifying branches;
- changing GitHub issues, pull requests, labels, reviews, or comments;
- applying fixes found during the review.

Any write action requires separate, explicit authorization for that action.

Validation commands may run only when they are non-destructive and do not leave tracked changes. Commands that may generate ignored or temporary artifacts are acceptable when those artifacts are safe and the tracked worktree remains unchanged. Otherwise, use a disposable worktree or report that the validation was not run.

Check the tracked worktree before and after local validation when practical. Report unexpected changes instead of cleaning them up without authorization.

## Resolve authoritative review context

Use GitHub as the source of truth for pull-request and issue metadata, including:

- pull-request number and description;
- declared base branch and base SHA;
- head branch and head SHA;
- issue contents and acceptance criteria;
- closing-keyword references;
- CI and check status;
- review metadata.

Use local Git when needed for:

- exact ref resolution;
- merge-base calculation;
- three-dot comparisons;
- reproducing behavior against the declared base;
- distinguishing baseline failures from regressions.

Identify and record:

- pull request;
- declared base branch and commit;
- head branch and commit;
- merge base or authoritative GitHub pull-request diff.

Review the complete pull-request change set. Prefer GitHub's authoritative pull-request diff when available. Otherwise, resolve the refs and use the equivalent of:

```bash
git diff <base>...<head>
```

Do not:

- assume the base branch is `main`;
- inspect only the latest commit;
- substitute a two-dot comparison when merge-base semantics are required;
- include unrelated working-tree changes;
- treat a stale local branch as authoritative over GitHub metadata.

When the complete range cannot be resolved, report the limitation and mark affected conclusions **Not verifiable**.

## Discover applicable issues

Verify requirements only for issues that are:

1. explicitly supplied by the user;
2. referenced by a GitHub closing keyword in the pull-request description; or
3. explicitly identified in the pull-request description as requirements the pull request intends to satisfy.

Treat incidental issue-number mentions, including ordinary `Refs #...` references, as context unless the user asks to verify them.

For every applicable issue, record why it is applicable.

Report conflicts between issue requirements and the pull-request scope instead of silently choosing an interpretation.

## Inspect the complete change

Inspect all relevant changed production code, tests, configuration, workflows, documentation, and repository-local agent files.

Check for:

- coding or logic defects;
- dead or unused code;
- unsafe, unsupported, or misleading patterns;
- edge cases and error paths;
- missing, brittle, or misleading tests;
- unnecessary complexity, dependencies, or generated artifacts;
- security, privacy, and outside-vault access concerns;
- out-of-scope changes;
- documentation, configuration, and issue-coverage inconsistencies.

For relevant changes, also check:

- preservation of user-authored notes;
- duplicate, collision, and no-overwrite behavior;
- command registration and Obsidian lifecycle wiring;
- stable command IDs;
- provider isolation from core note generation;
- settings defaults, normalization, persistence, and migration;
- typed internal errors and useful user-facing failures;
- testable workflows without unnecessary Obsidian runtime imports;
- Obsidian APIs for vault operations;
- accurate `isDesktopOnly` and compatibility metadata;
- no hidden telemetry, remote-code execution, or outside-vault access;
- no unnecessary production dependency or committed `main.js`.

Do not report unchanged-code concerns unless the pull request introduces, exposes, or materially depends on them.

## Validate proportionately

Select validation based on the changed files, affected behavior, and available evidence.

Run focused checks when they provide useful evidence. Run:

```bash
npm run check
```

when practical and proportionate.

For every command, record:

- exact command;
- working tree or ref where it ran;
- pass, fail, or incomplete result;
- relevant output or limitation.

State which expected checks were not run and why.

Report local validation and GitHub CI separately. Never claim a command, CI check, or manual test passed unless it was actually observed.

Classify each failure as:

- **PR regression:** evidence shows the pull request introduced it;
- **baseline failure:** evidence shows the same failure exists on the declared base;
- **unverified:** available evidence cannot distinguish them.

Use base-branch CI, repository evidence, or reproduction against the declared base when practical. Never classify from memory or assumption.

Passing automation does not prove runtime Obsidian behavior.

## Map issue coverage

Map every applicable requirement or acceptance criterion to precise implementation evidence using:

- **Satisfied**
- **Partially satisfied**
- **Not satisfied**
- **Not verifiable**

Evidence must identify a path plus a precise line, hunk, symbol, test, command result, or GitHub check.

Explain every partial, missing, or unverifiable result. Do not accept the pull-request description itself as proof of completion.

## Report findings proportionately

Report all evidence-backed blocking findings and meaningful non-blocking findings. A no-actionable-findings verdict is valid.

Assign each finding:

- **Severity:** Critical, Important, or Minor.
- **Disposition:** Blocking or Non-blocking.

Use these meanings:

- **Critical:** data loss, security compromise, destructive behavior, or fundamentally broken functionality.
- **Important:** correctness defect, incomplete issue requirement, meaningful regression, or inadequate protection of important behavior.
- **Minor:** actionable, limited-impact improvement that does not make the pull request unsafe or incomplete.
- **Blocking:** should be corrected before merge.
- **Non-blocking:** meaningful follow-up that does not prevent the current pull request from being merged.

Do not use Minor findings for stylistic preferences, speculative risks, or filler.

Every code finding must include:

```text
[Critical|Important|Minor] [Blocking|Non-blocking] Finding title
Path: path/to/file.ts:line or symbol/hunk
Evidence: Demonstrable behavior.
Impact: Why it matters.
Correction: Smallest concrete fix.
```

## Output contract

Use this order:

1. **Verdict**
2. **Blocking findings**
3. **Meaningful non-blocking findings**
4. **Linked-issue coverage**
5. **Validation and CI status**
6. **Remaining risks or manual verification**

State explicitly when a section has no findings.

For linked-issue coverage, use a compact requirement-to-evidence table when practical.

When runtime behavior changes, list only relevant remaining manual checks, such as:

- command registration and visibility;
- modal interaction;
- plugin reload and lifecycle behavior;
- generated-note behavior in a dedicated test vault;
- settings persistence;
- compatibility behavior not covered by automation.

Do not require a live Obsidian smoke test for documentation-only changes.

## Dry-run record

For the representative dry run, record:

- reviewed pull request;
- declared base branch and SHA;
- head branch and SHA;
- merge base or authoritative GitHub diff used;
- applicable issues and the discovery basis for each;
- validation commands and results;
- failure classifications;
- remaining manual verification;
- whether any tracked worktree changes occurred.

Record dry-run evidence in the implementing pull-request description or discussion unless a committed repository artifact provides demonstrated additional value.

## Completion standard

A review is complete only when it:

- remains within the read-only boundary unless separately authorized;
- covers the full pull-request diff against the declared base;
- verifies only applicable issues;
- maps requirements to precise evidence;
- reports exact validation commands and results;
- classifies failures as regression, baseline, or unverified;
- separates automated validation from remaining manual verification;
- assigns consistent severity and blocking status;
- provides locatable evidence for every code finding;
- permits an explicit no-actionable-findings verdict;
- avoids fabricated findings.