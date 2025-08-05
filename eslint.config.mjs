import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import securityPlugin from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Base configuration for all files
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
  },

  // Recommended rules from @eslint/js
  js.configs.recommended,

  // Source files configuration
  {
    files: ['src/**/*.js'],
    plugins: {
      import: importPlugin,
      jsdoc: jsdocPlugin,
      security: securityPlugin,
    },
    rules: {
      // Modern JavaScript best practices (relaxed for existing code)
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'prefer-destructuring': 'off', // Too many changes needed
      'prefer-rest-params': 'warn',
      'prefer-spread': 'warn',
      'no-var': 'warn',
      'object-shorthand': 'warn',
      'arrow-spacing': 'error',
      'template-curly-spacing': 'error',

      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_|^e$' }], // Allow 'e' for error handling
      'no-console': 'off', // Allow console for this library
      'no-debugger': 'error',
      'no-alert': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',

      // Style consistency
      'brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': ['error', { before: false, after: true }],
      'comma-style': ['error', 'last'],
      'computed-property-spacing': ['error', 'never'],
      'eol-last': 'error',
      'func-call-spacing': ['error', 'never'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'linebreak-style': ['error', 'unix'],
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'semi-spacing': ['error', { before: false, after: true }],
      'space-before-blocks': 'error',
      'space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'space-unary-ops': ['error', { words: true, nonwords: false }],

      // Import rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'never',
        },
      ],
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'error',
      'import/no-unresolved': 'off', // Disabled for browser environment

      // JSDoc rules (relaxed for existing code)
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-indentation': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-syntax': 'warn',
      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-types': 'warn',
      'jsdoc/empty-tags': 'warn',
      'jsdoc/no-undefined-types': 'off', // Disabled for browser globals
      'jsdoc/require-description': 'off', // Too strict for existing code
      'jsdoc/require-param': 'off', // Too strict for existing code
      'jsdoc/require-param-description': 'off',
      'jsdoc/require-param-name': 'warn',
      'jsdoc/require-returns': 'off', // Too strict for existing code
      'jsdoc/require-returns-description': 'off',
      'jsdoc/valid-types': 'warn',

      // Security rules (relaxed for library context)
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-object-injection': 'off', // Too many false positives in this context
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',
    },
  },

  // Test files configuration
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      // Relax some rules for test files
      'no-console': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'security/detect-object-injection': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,mjs}', '.eslintrc.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow require in config files
      'import/no-commonjs': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  // Example files
  {
    files: ['example/**/*.js'],
    rules: {
      // Relax rules for example files
      'no-console': 'off',
      'no-alert': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
    },
  },

  // Prettier compatibility (must be last)
  prettierConfig,

  // Global ignores
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.min.js', '*.map'],
  },
];
