import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await mkdir(new URL('site/assets/', root), { recursive: true });
for (const [source, target] of [
  ['node_modules/jspsych/dist/index.browser.min.js','jspsych.js'],
  ['node_modules/@jspsych/plugin-html-button-response/dist/index.browser.min.js','html-button-response.js'],
  ['node_modules/@jspsych/plugin-instructions/dist/index.browser.min.js','instructions.js'],
  ['dist/index.global.js','budgeted-choice.js']
]) await cp(new URL(source, root), new URL(`site/assets/${target}`, root));
let html = await readFile(new URL('examples/the-month.html', root), 'utf8');
html = html.replaceAll('https://unpkg.com/jspsych@8.2.1', './assets/jspsych.js')
  .replaceAll('https://unpkg.com/@jspsych/plugin-html-button-response@2.1.0','./assets/html-button-response.js')
  .replaceAll('https://unpkg.com/@jspsych/plugin-instructions@2.1.0','./assets/instructions.js')
  .replaceAll('../dist/index.global.js','./assets/budgeted-choice.js')
  .replaceAll('./assets/jspsych.js/css/jspsych.css','./assets/jspsych.css');
await writeFile(new URL('site/index.html', root), html);
await writeFile(new URL('site/.nojekyll', root), '');
console.log('Built site/index.html with local assets; no CDN needed at runtime.');
await cp(new URL('docs/THIRD-PARTY-NOTICES.txt', root), new URL('site/THIRD-PARTY-NOTICES.txt', root));

// Use system fonts: keep jsPsych layout styles without redistributing font files.
const css = (await readFile(new URL('node_modules/jspsych/css/jspsych.css', root), 'utf8'))
  .replace(/@font-face\s*\{[\s\S]*?\}/g, '')
  .replaceAll('"Open Sans"', 'system-ui').replaceAll("'Open Sans'", 'system-ui');
await writeFile(new URL('site/assets/jspsych.css', root), css);
