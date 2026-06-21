export function normalizeVaultPath(path: string): string {
	const trimmedPath = path.trim();

	if (trimmedPath.length === 0) {
		return '';
	}

	const segments: string[] = [];

	for (const segment of trimmedPath.split(/[\\/]+/)) {
		if (segment.length === 0 || segment === '.') {
			continue;
		}

		segments.push(segment);
	}

	return segments.join('/');
}
