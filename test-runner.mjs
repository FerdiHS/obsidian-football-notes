import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
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

function run() {
	const require = createRequire(import.meta.url);
	const rootDir = process.cwd();
	const jitiRegisterPath = resolve(
		dirname(require.resolve('jiti/package.json')),
		'lib/jiti-register.mjs',
	);
	const testFiles = collectTestFiles(rootDir).map((file) => resolve(rootDir, file));
	const childEnv = { ...process.env };
	delete childEnv.NODE_TEST_CONTEXT;
	const result = spawnSync(
		process.execPath,
		['--import', jitiRegisterPath, '--test', ...testFiles],
		{
			encoding: 'utf8',
			env: childEnv,
		},
	);

	if (result.error) {
		process.exit(1);
	}

	if (result.status === 0) {
		if (result.stdout) {
			process.stdout.write(result.stdout);
		}
	} else {
		if (result.stdout) {
			process.stderr.write(result.stdout);
		}
	}

	if (result.stderr) {
		process.stderr.write(result.stderr);
	}

	process.exit(result.status ?? 1);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	run();
}
