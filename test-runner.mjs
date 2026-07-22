import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SUPPORTED_TEST_SUFFIXES = ['.test.ts', '.test.mjs'];

function toPosixPath(path) {
	return path.split(sep).join('/');
}

export function collectTestFiles(rootDir) {
	const discoveredFiles = [];

	function walk(currentDir) {
		for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				if (entry.name === 'node_modules') {
					continue;
				}

				walk(resolve(currentDir, entry.name));
				continue;
			}

			if (!entry.isFile()) {
				continue;
			}

			if (!SUPPORTED_TEST_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) {
				continue;
			}

			discoveredFiles.push(toPosixPath(relative(rootDir, resolve(currentDir, entry.name))));
		}
	}

	walk(rootDir);

	return discoveredFiles.sort();
}

export function run({ proc = process, spawn = spawnSync } = {}) {
	const rootDir = proc.cwd();
	const testFiles = collectTestFiles(rootDir).map((file) => resolve(rootDir, file));

	if (testFiles.length === 0) {
		proc.stderr.write('No test files found.\n');
		proc.exit(1);
	}

	const childEnv = { ...proc.env };
	delete childEnv.NODE_TEST_CONTEXT;

	const result = spawn(
		proc.execPath,
		['--import', 'jiti/register', '--test', ...testFiles],
		{
			env: childEnv,
			stdio: 'inherit',
		},
	);

	if (result.error) {
		proc.exit(1);
	}

	proc.exit(result.status ?? 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	run();
}
