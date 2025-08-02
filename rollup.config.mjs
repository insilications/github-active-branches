import { defineConfig } from 'rollup';
import pkg from './package.json' with { type: 'json' };
import userscript from 'rollup-plugin-userscript';
import replacePlugin from '@rollup/plugin-replace';
import postcssPlugin from 'rollup-plugin-postcss';
import commonjsPlugin from '@rollup/plugin-commonjs';
import resolvePlugin from '@rollup/plugin-node-resolve';
import jsonPlugin from '@rollup/plugin-json';
import tailwindcss from '@tailwindcss/postcss';
import { importAsString } from 'rollup-plugin-string-import';
import swc from '@rollup/plugin-swc';

const extensions = ['.ts', '.tsx', '.mjs', '.js', '.jsx'];

function insertCss(cssVariableName, fileId) {
  return `GM_addStyle(${cssVariableName})`;
}

export default defineConfig(
  Object.entries({
    'github-active-branches': 'src/index.ts',
  }).map(([name, entry]) => ({
    input: entry,
    plugins: [
      postcssPlugin({
        inject: false,
        extract: false,
        minimize: true,
        plugins: [tailwindcss],
        config: {
          path: './postcss.config.mjs',
        },
      }),
      replacePlugin({
        values: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        },
        preventAssignment: true,
      }),
      resolvePlugin({ browser: false, preferBuiltins: true, extensions }),
      commonjsPlugin(),
      jsonPlugin(),
      importAsString({
        include: ['src/**/*.gql'],
      }),
      swc({
        // Explicitly point to the tsconfig.json file
        tsconfig: './tsconfig.json',
      }),
      userscript((meta) => meta.replace('process.env.AUTHOR', pkg.author)),
    ],
    output: {
      format: 'iife',
      file: `dist/${name}.user.js`,
      indent: false,
      // extend: true,
      esModule: true,
    },
  })),
);
