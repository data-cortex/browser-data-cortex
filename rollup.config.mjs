import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default [
  // JavaScript bundle
  {
    input: 'src/index.ts',
    output: {
      name: 'DataCortex',
      file: pkg.browser,
      format: 'umd',
      exports: 'named',
      sourcemap: true,
      globals: {},
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Don't generate declarations in this build
        rootDir: './src',
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
        preventAssignment: true,
      }),
      terser({
        compress: {
          drop_console: false,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      }),
    ],
    external: [],
  },
  // TypeScript declarations bundle
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
];
