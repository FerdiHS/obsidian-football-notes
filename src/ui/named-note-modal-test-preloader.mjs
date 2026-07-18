/* eslint-disable no-undef */

import { resolve } from 'node:path';

process.env.JITI_ALIAS = JSON.stringify({
	obsidian: resolve('src/ui/named-note-modal-test-support.ts'),
});
