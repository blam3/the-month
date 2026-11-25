import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
for (const file of [pkg.main, pkg.module, pkg.types, pkg.unpkg]) assert(existsSync(file), `Missing ${file}`);
// jsPsych is browser software and expects window at import time.
const {JSDOM} = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
const esm = await import('@blam3/plugin-budgeted-choice');
const cjs = require('@blam3/plugin-budgeted-choice');
assert.equal(typeof esm.default, 'function');
assert.equal(typeof cjs, 'function');
assert.equal(esm.default.info.version, pkg.version);
assert.equal(cjs.info.version, pkg.version);
assert.equal(esm.default.info.name, 'budgeted-choice');
console.log('ESM, CommonJS, declaration and browser entry points verified.');

dom.window.close();
