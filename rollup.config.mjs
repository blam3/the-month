import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
export default {
  input: 'src/index.ts',
  external: ['jspsych'],
  plugins: [json(), typescript({ declaration: true, outDir: 'dist' })],
  output: [
    { file: 'dist/index.js', format: 'es' },
    { file: 'dist/index.cjs', format: 'cjs', exports: 'default' },
    { file: 'dist/index.global.js', format: 'iife', name: 'jsPsychBudgetedChoice', exports: 'default', globals: { jspsych: 'jsPsychModule' } }
  ]
};
