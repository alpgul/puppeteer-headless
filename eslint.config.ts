import eslintPluginEslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslintJs from '@eslint/js';
import eslintJson from '@eslint/json';
import eslintConfigLove from 'eslint-config-love';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginJsdoc from 'eslint-plugin-jsdoc';
import eslintPluginPackageJson from 'eslint-plugin-package-json';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginSecurity from 'eslint-plugin-security';
import eslintPluginSonarJs from 'eslint-plugin-sonarjs';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import * as eslintPluginWriteGoodComments from 'eslint-plugin-write-good-comments';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/*.d.ts', '**/package-lock.json', '**/build/*', '**/dist/*']),

  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
  },

  eslintPluginPackageJson.configs.recommended,

  // Unified configuration with comprehensive TypeScript support
  {
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- eslint-plugin-eslint-comments
      eslintPluginEslintComments.recommended,
      eslintPluginJsdoc.configs['flat/recommended-typescript'],
      eslintPluginPerfectionist.configs['recommended-natural'],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access --- eslint-plugin-eslint-comments
      eslintPluginSecurity.configs.recommended,
      eslintPluginSonarJs.configs.recommended,
      eslintPluginUnicorn.configs.recommended,
    ],
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      ...Object.fromEntries(
        Object.entries(eslintConfigLove.plugins ?? {}).filter(([key]) => key !== '@typescript-eslint'),
      ),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- eslint-plugin-eslint-comments
      'write-good-comments': eslintPluginWriteGoodComments,
    },

    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.es2025,
        ...globals.browser,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
    },

    rules: {
      ...eslintConfigLove.rules,
      '@typescript-eslint/unbound-method': 'off',
      'no-extend-native': 'off',
      'write-good-comments/write-good-comments': 'warn',

      '@typescript-eslint/init-declarations': 'warn',
      '@typescript-eslint/no-magic-numbers': [
        'warn',
        {
          ignore: [20],
        },
      ],
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      '@typescript-eslint/no-extraneous-class': 'warn',
      '@typescript-eslint/no-invalid-void-type': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-type-assertion': 'warn',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/space-before-function-paren': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'warn',

      complexity: [
        'warn',
        {
          max: 20,
        },
      ],

      'no-console': 'warn',

      '@eslint-community/eslint-comments/require-description': 'off',

      'jsdoc/require-jsdoc': ['warn', { publicOnly: true }],

      'no-extra-semi': 'off',

      'no-undef': 'off',

      // checked by "@typescript-eslint/no-unused-vars"
      'no-unused-vars': 'off',

      'perfectionist/sort-imports': [
        'error',
        {
          groups: [
            'builtin',
            ['external', 'internal-type', 'internal', 'type'],
            ['parent-type', 'parent'],
            ['sibling-type', 'sibling'],
            'unknown',
          ],
          partitionByNewLine: false,
        },
      ],
      'perfectionist/sort-interfaces': 'warn',
      'perfectionist/sort-modules': 'warn',
      'perfectionist/sort-named-exports': [
        'error',
        {
          groupKind: 'types-first',
        },
      ],
      'perfectionist/sort-named-imports': [
        'error',
        {
          groupKind: 'types-first',
        },
      ],
      'perfectionist/sort-object-types': 'warn',
      'perfectionist/sort-objects': 'warn',

      'perfectionist/sort-union-types': [
        'error',
        {
          groups: ['unknown', 'nullish'],
        },
      ],

      // checked by "no-useless-escape"
      'regexp/no-useless-escape': 'off',

      // checked by "complexity"
      'sonarjs/cognitive-complexity': 'off',

      'sonarjs/public-static-readonly': 'off',

      // checked by "regexp/no-dupe-characters-character-class"
      'sonarjs/duplicates-in-character-class': 'off',

      'sonarjs/no-duplicate-string': 'warn',

      // checked by "@typescript-eslint/no-misused-promises"
      'sonarjs/no-misused-promises': 'off',

      // checked by "@typescript-eslint/no-redundant-type-constituents"
      'sonarjs/no-redundant-type-constituents': 'off',

      'sonarjs/unnecessary-character-escapes': 'off',

      'unicorn/consistent-function-scoping': 'warn',
      'unicorn/empty-brace-spaces': 'off',
      'unicorn/filename-case': [
        'error',
        {
          case: 'camelCase',
          ignore: ['DB', 'URL'],
        },
      ],
      ...prettierConfig.rules,
    },
    settings: {
      'import/resolver': {
        typescript: {
          node: true,
          project: './tsconfig.json',
        },
      },
      perfectionist: {
        partitionByNewLine: true,
      },
    },
  },
  {
    extends: [eslintJson.configs.recommended],
    files: ['**/*.json'],
    ignores: ['**/package.json'],
    language: 'json/json',
    plugins: {
      json: eslintJson,
    },
  },
]);
