import { readFileSync, writeFileSync } from 'fs';

const mode = process.argv[2] ?? 'sync';

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
	writeFileSync(path, JSON.stringify(value, null, '\t'));
}

const packageJson = readJson('package.json');
const manifest = readJson('manifest.json');
const versions = readJson('versions.json');

const packageVersion = packageJson.version;
const manifestVersion = manifest.version;
const minAppVersion = manifest.minAppVersion;
const hasVersionEntry = Object.prototype.hasOwnProperty.call(versions, packageVersion);

if (mode === 'check') {
	const issues = [];

	if (packageVersion !== manifestVersion) {
		issues.push(
			`package.json version (${packageVersion}) does not match manifest.json version (${manifestVersion}).`,
		);
	}

	if (!hasVersionEntry) {
		issues.push(`versions.json is missing an entry for ${packageVersion}.`);
	}

	if (issues.length > 0) {
		console.error('Version metadata is out of sync:');
		for (const issue of issues) {
			console.error(`- ${issue}`);
		}
		console.error('Run `npm run version:sync` to update the tracked release metadata.');
		process.exit(1);
	}

	process.exit(0);
}

if (mode !== 'sync') {
	console.error(`Unknown mode "${mode}". Use "sync" or "check".`);
	process.exit(1);
}

let changed = false;

if (manifestVersion !== packageVersion) {
	manifest.version = packageVersion;
	changed = true;
}

if (!hasVersionEntry) {
	versions[packageVersion] = minAppVersion;
	changed = true;
}

if (changed) {
	writeJson('manifest.json', manifest);
	writeJson('versions.json', versions);
}
