import { sanitizeNoteTitle } from './note-title';

export interface NamedNoteCreatedFile {
	name: string;
}

export interface NamedNoteInput {
	destinationFolder: string;
	name: string;
}

export interface NamedNoteWorkflowDependencies<
	TCreatedFile extends NamedNoteCreatedFile = NamedNoteCreatedFile,
> {
	destinationFolder: string;
	noteKind: 'team' | 'player';
	createNoteFile: (input: NamedNoteInput) => Promise<TCreatedFile>;
	openNote: (file: TCreatedFile) => Promise<void>;
	showNotice: (message: string) => void;
	logError: (message: string, error: unknown) => void;
}

export async function createNamedNoteWorkflow<
	TCreatedFile extends NamedNoteCreatedFile = NamedNoteCreatedFile,
>(input: string, dependencies: NamedNoteWorkflowDependencies<TCreatedFile>): Promise<boolean> {
	const normalizedName = input.trim();

	if (normalizedName.length === 0 || sanitizeNoteTitle(normalizedName).length === 0) {
		dependencies.showNotice(`${capitalizeWord(dependencies.noteKind)} name cannot be empty.`);
		return false;
	}

	try {
		const createdFile = await dependencies.createNoteFile({
			destinationFolder: dependencies.destinationFolder,
			name: normalizedName,
		});

		try {
			await dependencies.openNote(createdFile);
		} catch (error) {
			dependencies.logError(
				`Created ${dependencies.noteKind} note, but could not open it.`,
				error,
			);
			dependencies.showNotice(
				`Created ${dependencies.noteKind} note: ${createdFile.name}, but could not open it automatically.`,
			);
			return true;
		}

		dependencies.showNotice(`Created ${dependencies.noteKind} note: ${createdFile.name}`);
		return true;
	} catch (error) {
		dependencies.logError(`Failed to create ${dependencies.noteKind} note.`, error);
		dependencies.showNotice(
			`Could not create ${dependencies.noteKind} note. See console for details.`,
		);
		return false;
	}
}

function capitalizeWord(value: string): string {
	return value.slice(0, 1).toUpperCase() + value.slice(1);
}
