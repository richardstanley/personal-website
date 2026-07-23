import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  // Base ESLint recommended config for all files
  eslint.configs.recommended,
  
  // Ignore patterns for generated files and dependencies
  {
    ignores: [
      'dist/',
      'node_modules/',
      'cdk.out/',
      '**/*.d.ts', // Generated TypeScript declaration files
      '**/*.js', // Generated JavaScript files (will be configured separately below)
      '!jest.config.js', // Don't ignore specific JS files we want to lint
      '!site-content/**/*.js', // Don't ignore browser JS files
    ],
  },
  
  // Configuration for TypeScript files
  {
    files: ['**/*.ts'],
    ignores: ['**/*.d.ts'], // Ignore declaration files
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'no-undef': 'off', // TypeScript handles this better
    },
  },
  
  // Configuration for Node.js JavaScript files
  {
    files: ['**/*.js'],
    ignores: ['site-content/**/*.js', 'node_modules/**', 'cdk.out/**'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.node,
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        exports: 'writable',
        require: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
  
  // Configuration for browser JavaScript files (site-content)
  {
    files: ['site-content/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-undef': 'off', // Browser globals are defined above
    },
  },
  
  // Configuration for test files
  {
    files: ['test/**/*.ts', 'test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
        test: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-undef': 'off', // Test globals are defined above
    },
  },
  
  // Configuration for Jest config file
  {
    files: ['jest.config.js'],
    languageOptions: {
      globals: {
        module: 'writable',
      },
    },
  },
];
