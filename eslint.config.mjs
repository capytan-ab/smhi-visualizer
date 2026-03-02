import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import pluginPromise from 'eslint-plugin-promise'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  pluginPromise.configs['flat/recommended'],
  pluginPrettierRecommended,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      eqeqeq: 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prettier/prettier': 'warn',
      'prefer-template': 'error',
      'no-useless-concat': 'error',
      'no-implicit-coercion': 'error',
      quotes: ['error', 'single', { avoidEscape: true }],
      'promise/prefer-await-to-callbacks': 'error',
      'promise/prefer-await-to-then': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
    },
  },
])

export default eslintConfig
