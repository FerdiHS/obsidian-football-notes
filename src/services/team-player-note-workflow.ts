import { sanitizeNoteTitle } from './note-title';

export interface NamedNoteCreatedFile {
	name: string;
}

export interface NamedNoteCreationResult<
	TCreatedFile extends NamedNoteCreatedFile = NamedNoteCreatedFile,
> {
	file: TCreatedFile;
	existedAlready: boolean;
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
	createNoteFile: (input: NamedNoteInput) => Promise<NamedNoteCreationResult<TCreatedFile>>;
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
		const createdResult = await dependencies.createNoteFile({
			destinationFolder: dependencies.destinationFolder,
			name: normalizedName,
		});
		const action = createdResult.existedAlready ? 'Opened existing' : 'Created';

		try {
			await dependencies.openNote(createdResult.file);
		} catch (error) {
			dependencies.logError(
				`${action} ${dependencies.noteKind} note, but could not open it.`,
				error,
			);
			dependencies.showNotice(
				`${action} ${dependencies.noteKind} note: ${createdResult.file.name}, but could not open it automatically.`,
			);
			return true;
		}

		dependencies.showNotice(
			`${action} ${dependencies.noteKind} note: ${createdResult.file.name}`,
		);
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
