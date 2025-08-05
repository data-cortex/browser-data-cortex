import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  output: {
    name: 'DataCortex',
    file: pkg.browser,
    format: 'umd',
    sourcemap: true,
    globals: {
      // Define any external dependencies here if needed
    },
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['> 1%', 'last 2 versions', 'not dead'],
            },
          },
        ],
      ],
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      preventAssignment: true,
    }),
    terser({
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    }),
  ],
  external: [], // Add any external dependencies here
};
