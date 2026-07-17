import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveManualMatchTeamNotes } from './manual-match-team-notes';

void test('resolveManualMatchTeamNotes resolves home and away team notes', async () => {
	const createTeamNoteCalls: Array<{ destinationFolder: string; name: string }> = [];

	const result = await resolveManualMatchTeamNotes(
		{
			homeTeam: 'Real Madrid',
			awayTeam: 'Barcelona',
		},
		{
			teamNotesFolder: 'Football notes/teams',
			createTeamNoteFile: async (input) => {
				createTeamNoteCalls.push(input);

				return input.name === 'Real Madrid'
					? {
							file: {
								path: 'Football notes/teams/Real Madrid.md',
								name: 'Real Madrid.md',
							},
							existedAlready: false,
						}
					: {
							file: {
								path: 'Football notes/teams/Barcelona.md',
								name: 'Barcelona.md',
							},
							existedAlready: true,
						};
			},
			deleteTeamNoteFile: async () => {
				throw new Error('should not be called');
			},
			logError: () => {
				throw new Error('should not be called');
			},
		},
	);

	assert.deepEqual(createTeamNoteCalls, [
		{
			destinationFolder: 'Football notes/teams',
			name: 'Real Madrid',
		},
		{
			destinationFolder: 'Football notes/teams',
			name: 'Barcelona',
		},
	]);
	assert.deepEqual(result, {
		homeTeam: {
			notePath: 'Football notes/teams/Real Madrid',
			existedAlready: false,
			fileName: 'Real Madrid.md',
			file: {
				path: 'Football notes/teams/Real Madrid.md',
				name: 'Real Madrid.md',
			},
		},
		awayTeam: {
			notePath: 'Football notes/teams/Barcelona',
			existedAlready: true,
			fileName: 'Barcelona.md',
			file: {
				path: 'Football notes/teams/Barcelona.md',
				name: 'Barcelona.md',
			},
		},
	});
});

void test('resolveManualMatchTeamNotes propagates team note creation failures', async () => {
	const calls: string[] = [];
	const cleanupCalls: string[] = [];

	await assert.rejects(
		resolveManualMatchTeamNotes(
			{
				homeTeam: 'Real Madrid',
				awayTeam: 'Barcelona',
			},
			{
				teamNotesFolder: 'Football notes/teams',
				createTeamNoteFile: async (input) => {
					calls.push(input.name);

					throw new Error(
						'Cannot create team note because "Football notes/teams/Real Madrid.md" already exists as a non-team file.',
					);
				},
				deleteTeamNoteFile: async (file) => {
					cleanupCalls.push(file.path);
				},
				logError: () => {
					throw new Error('should not be called');
				},
			},
		),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(calls, ['Real Madrid']);
	assert.deepEqual(cleanupCalls, []);
});

void test('resolveManualMatchTeamNotes rolls back a created home team note if away creation fails', async () => {
	const createCalls: string[] = [];
	const cleanupCalls: string[] = [];

	await assert.rejects(
		resolveManualMatchTeamNotes(
			{
				homeTeam: 'Real Madrid',
				awayTeam: 'Barcelona',
			},
			{
				teamNotesFolder: 'Football notes/teams',
				createTeamNoteFile: async (input) => {
					createCalls.push(input.name);

					if (input.name === 'Real Madrid') {
						return {
							file: {
								path: 'Football notes/teams/Real Madrid.md',
								name: 'Real Madrid.md',
							},
							existedAlready: false,
						};
					}

					throw new Error(
						'Cannot create team note because "Football notes/teams/Barcelona.md" already exists as a non-team file.',
					);
				},
				deleteTeamNoteFile: async (file) => {
					cleanupCalls.push(file.path);
				},
				logError: () => {
					throw new Error('should not be called');
				},
			},
		),
		/Cannot create team note because "Football notes\/teams\/Barcelona\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(createCalls, ['Real Madrid', 'Barcelona']);
	assert.deepEqual(cleanupCalls, ['Football notes/teams/Real Madrid.md']);
});

void test('resolveManualMatchTeamNotes warns when rollback cleanup fails after away creation failure', async () => {
	const notices: string[] = [];
	const errors: string[] = [];

	await assert.rejects(
		resolveManualMatchTeamNotes(
			{
				homeTeam: 'Real Madrid',
				awayTeam: 'Barcelona',
			},
			{
				teamNotesFolder: 'Football notes/teams',
				createTeamNoteFile: async (input) => {
					if (input.name === 'Real Madrid') {
						return {
							file: {
								path: 'Football notes/teams/Real Madrid.md',
								name: 'Real Madrid.md',
							},
							existedAlready: false,
						};
					}

					throw new Error(
						'Cannot create team note because "Football notes/teams/Barcelona.md" already exists as a non-team file.',
					);
				},
				deleteTeamNoteFile: async () => {
					throw new Error('trash failed');
				},
				logError: (message, error) => {
					errors.push(`${message}: ${(error as Error).message}`);
				},
				showNotice: (message) => {
					notices.push(message);
				},
			},
		),
		/Cannot create team note because "Football notes\/teams\/Barcelona\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(errors, [
		'Failed to roll back created home team note after away team note resolution failed.: trash failed',
	]);
	assert.deepEqual(notices, [
		'Could not remove created home team note: Real Madrid.md. Please review it manually.',
	]);
});
