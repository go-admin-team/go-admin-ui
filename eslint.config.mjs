import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'

/**
 * ESLint 9 flat config.
 *
 * Migrated rule-by-rule from .eslintrc.js and kept behaviourally equivalent:
 * any difference would be amplified into a full reformat across 23,000 existing
 * lines. Debatable legacy rules are therefore preserved rather than tidied up
 * as a side effect of this migration.
 *
 * ESLint 9 deprecates the built-in formatting rules, so they are served by
 * @stylistic instead — same option values, names prefixed with `@stylistic/`.
 */
export default [
  {
    // Migrated from .eslintignore, which flat config no longer reads
    ignores: [
      'build/*.js',
      'src/assets/**',
      'public/**',
      'dist/**',
      'node_modules/**'
    ]
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  // TypeScript rules apply to .ts/.tsx only, keeping legacy JS out of them so
  // the migration does not drown in noise
  ...tseslint.configs.recommended.map(c => ({ ...c, files: ['**/*.ts', '**/*.tsx'] })),

  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,vue}'],
    plugins: { '@stylistic': stylistic },
    linterOptions: {
      // ESLint 9 defaults this to warn; the old config did not report it. Some
      // existing files carry eslint-disable comments for rules that are not
      // enabled (max-len / guard-for-in etc). Removing those touches application
      // code and is out of scope here.
      reportUnusedDisableDirectives: 'off'
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // The .js files under FormGenRender/slots and utils/generator contain JSX.
      // @babel/eslint-parser handled it before; flat config must opt in explicitly.
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021
      }
    },
    rules: {
      // ── Vue ────────────────────────────────────────────────
      'vue/max-attributes-per-line': [2, {
        singleline: { max: 10 },
        multiline: { max: 1 }
      }],
      'vue/no-template-shadow': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/no-v-html': 'off',
      'vue/no-deprecated-slot-attribute': 'warn',
      'vue/multi-word-component-names': 'warn',

      // ── Formatting (@stylistic) ───────────────────────────
      '@stylistic/arrow-spacing': [2, { before: true, after: true }],
      '@stylistic/block-spacing': [2, 'always'],
      '@stylistic/brace-style': [2, '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-dangle': [2, 'never'],
      '@stylistic/comma-spacing': [2, { before: false, after: true }],
      '@stylistic/comma-style': [2, 'last'],
      '@stylistic/dot-location': [2, 'property'],
      '@stylistic/eol-last': 2,
      '@stylistic/generator-star-spacing': [2, { before: true, after: true }],
      '@stylistic/indent': [2, 2, { SwitchCase: 1 }],
      '@stylistic/jsx-quotes': [2, 'prefer-single'],
      '@stylistic/key-spacing': [2, { beforeColon: false, afterColon: true }],
      '@stylistic/keyword-spacing': [2, { before: true, after: true }],
      '@stylistic/new-parens': 2,
      '@stylistic/no-extra-parens': [2, 'functions'],
      '@stylistic/no-floating-decimal': 2,
      '@stylistic/no-mixed-spaces-and-tabs': 2,
      '@stylistic/no-multi-spaces': 2,
      '@stylistic/no-multiple-empty-lines': [2, { max: 1 }],
      '@stylistic/no-trailing-spaces': 2,
      '@stylistic/no-whitespace-before-property': 2,
      '@stylistic/function-call-spacing': [2, 'never'], // was no-spaced-func
      '@stylistic/operator-linebreak': [2, 'after', {
        overrides: { '?': 'before', ':': 'before' }
      }],
      '@stylistic/padded-blocks': [2, 'never'],
      '@stylistic/quotes': [2, 'single', {
        avoidEscape: true,
        allowTemplateLiterals: true
      }],
      '@stylistic/semi': [2, 'never'],
      '@stylistic/semi-spacing': [2, { before: false, after: true }],
      '@stylistic/space-before-blocks': [2, 'always'],
      '@stylistic/space-before-function-paren': [2, 'never'],
      '@stylistic/space-in-parens': [2, 'never'],
      '@stylistic/space-infix-ops': 2,
      '@stylistic/space-unary-ops': [2, { words: true, nonwords: false }],
      '@stylistic/spaced-comment': [2, 'always', {
        markers: ['global', 'globals', 'eslint', 'eslint-disable', '*package', '!', ',']
      }],
      '@stylistic/template-curly-spacing': [2, 'never'],
      '@stylistic/wrap-iife': [2, 'any'],
      '@stylistic/yield-star-spacing': [2, 'both'],
      '@stylistic/object-curly-spacing': [2, 'always', { objectsInObjects: false }],
      '@stylistic/array-bracket-spacing': [2, 'never'],

      // ── Correctness ───────────────────────────────────────
      'accessor-pairs': 2,
      'camelcase': [0, { properties: 'always' }],
      'constructor-super': 2,
      'curly': [2, 'multi-line'],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'new-cap': [2, { newIsCap: true, capIsNew: false }],
      'no-array-constructor': 2,
      'no-caller': 2,
      'no-class-assign': 2,
      'no-cond-assign': 2,
      'no-console': 'off',
      'no-const-assign': 2,
      'no-control-regex': 0,
      'no-delete-var': 2,
      'no-dupe-args': 2,
      'no-dupe-class-members': 2,
      'no-dupe-keys': 2,
      'no-duplicate-case': 2,
      'no-empty-character-class': 2,
      'no-empty-pattern': 2,
      'no-eval': 2,
      'no-ex-assign': 2,
      'no-extend-native': 2,
      'no-extra-bind': 2,
      'no-extra-boolean-cast': 2,
      'no-fallthrough': 2,
      'no-func-assign': 2,
      'no-global-assign': 2, // was no-native-reassign
      'no-implied-eval': 2,
      'no-inner-declarations': [2, 'functions'],
      'no-invalid-regexp': 2,
      'no-irregular-whitespace': 2,
      'no-iterator': 2,
      'no-label-var': 2,
      'no-labels': [2, { allowLoop: false, allowSwitch: false }],
      'no-lone-blocks': 2,
      'no-multi-str': 2,
      'no-new-native-nonconstructor': 2, // was no-new-symbol
      'no-new-object': 2,
      'no-new-wrappers': 2,
      'no-obj-calls': 2,
      'no-octal': 2,
      'no-octal-escape': 2,
      'no-proto': 2,
      'no-redeclare': 2,
      'no-regex-spaces': 2,
      'no-return-assign': [2, 'except-parens'],
      'no-self-assign': 2,
      'no-self-compare': 2,
      'no-sequences': 2,
      'no-shadow-restricted-names': 2,
      'no-sparse-arrays': 2,
      'no-this-before-super': 2,
      'no-throw-literal': 2,
      'no-undef': 2,
      'no-undef-init': 2,
      'no-unexpected-multiline': 2,
      'no-unmodified-loop-condition': 2,
      'no-unneeded-ternary': [2, { defaultAssignment: false }],
      'no-unreachable': 2,
      'no-unsafe-finally': 2,
      'no-unsafe-negation': 2, // was no-negated-in-lhs
      'no-unused-vars': [2, { vars: 'all', args: 'none' }],
      'no-useless-call': 2,
      'no-useless-computed-key': 2,
      'no-useless-constructor': 2,
      'no-useless-escape': 0,
      'no-with': 2,
      'one-var': [2, { initialized: 'never' }],
      'use-isnan': 2,
      'valid-typeof': 2,
      'yoda': [2, 'never'],
      'prefer-const': 2,
      'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0
    }
  },

  {
    // Leading `|` and `&` are the idiomatic layout for multi-line TypeScript
    // union and intersection types, which the JS-oriented `after` setting
    // rejects. Scoped to .ts so the rule is unchanged for JS bitwise operators.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@stylistic/operator-linebreak': [2, 'after', {
        overrides: { '?': 'before', ':': 'before', '|': 'before', '&': 'before' }
      }]
    }
  },

  {
    // Migrated from tests/unit/.eslintrc.js
    files: ['tests/**/*.{js,ts}'],
    languageOptions: {
      globals: { ...globals.jest }
    }
  }
]
