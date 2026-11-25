import { cp, mkdir } from 'node:fs/promises';
await mkdir('docs/assets', {recursive:true});
await cp('site/assets','docs/assets',{recursive:true});
await cp('site/index.html','docs/index.html');
await cp('site/.nojekyll','docs/.nojekyll');
console.log('Prepared docs/ for GitHub Pages (main branch, /docs source).');
