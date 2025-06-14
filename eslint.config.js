import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import eslintCommentsPlugin from 'eslint-plugin-eslint-comments'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['node_modules', 'build', 'dist', 'coverage'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'eslint-comments': eslintCommentsPlugin,
      import: importPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
      'eslint-comments/no-unused-disable': 'error',
      'import/order': ['error', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
      'sort-imports': ['error', { ignoreDeclarationSort: true, ignoreCase: true }],
    },
  },
  {
    // Rules for test files
    files: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]