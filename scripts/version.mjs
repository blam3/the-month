import {readFile, writeFile} from 'node:fs/promises';
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
await writeFile(new URL('../src/version.ts', import.meta.url), `// Generated from package.json by the build.\nexport const version = ${JSON.stringify(pkg.version)};\n`);
