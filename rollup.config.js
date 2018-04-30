
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    output: {
      name: 'browser-data-cortex',
      file: pkg.browser,
      format: 'umd',
      sourceMap: true,
    },
    plugins: [
      babel({ exclude: 'node_modules/**', }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
      resolve({ browser: true, }),
      commonjs(),
      uglify(),
    ],
  },
]
