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
		},
		awayTeam: {
			notePath: 'Football notes/teams/Barcelona',
			existedAlready: true,
			fileName: 'Barcelona.md',
		},
	});
});

void test('resolveManualMatchTeamNotes propagates team note creation failures', async () => {
	const calls: string[] = [];

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
			},
		),
		/Cannot create team note because "Football notes\/teams\/Real Madrid\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(calls, ['Real Madrid']);
});

void test('resolveManualMatchTeamNotes leaves a created home team note in place if away creation fails', async () => {
	const createCalls: string[] = [];

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
			},
		),
		/Cannot create team note because "Football notes\/teams\/Barcelona\.md" already exists as a non-team file\./,
	);

	assert.deepEqual(createCalls, ['Real Madrid', 'Barcelona']);
});
