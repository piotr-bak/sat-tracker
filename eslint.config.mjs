import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig } from 'eslint/config';
import perfectionist from 'eslint-plugin-perfectionist';

const unsafe = ['assignment', 'call', 'member-access', 'return', 'argument'];

export default defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            perfectionist,
        },
        rules: {
            // Bugs
            eqeqeq: ['error', 'always'],
            curly: ['error', 'multi-line'], // Braces unless the `if` fits on one line.
            'no-empty': ['error', { allowEmptyCatch: false }],

            // Types
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error', // Noisy at times: disable per line, with a reason.
            '@typescript-eslint/switch-exhaustiveness-check': [
                'error',
                { requireDefaultForNonUnion: true },
            ],
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    'ts-ignore': true,
                    'ts-expect-error': 'allow-with-description',
                },
            ],
            ...Object.fromEntries(
                unsafe.map((name) => [
                    `@typescript-eslint/no-unsafe-${name}`,
                    'error',
                ]),
            ),
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'inline-type-imports',
                },
            ],

            // Promises: every error handled
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            'perfectionist/sort-imports': [
                'error',
                {
                    type: 'natural',
                    newlinesBetween: 0,
                    internalPattern: ['^@/'],
                    customGroups: [
                        {
                            groupName: 'react',
                            elementNamePattern: [
                                '^react$',
                                '^react/',
                                '^react-dom',
                            ],
                            selector: 'import',
                            modifiers: ['value'],
                        },
                        {
                            groupName: 'next',
                            elementNamePattern: ['^next$', '^next/'],
                            selector: 'import',
                            modifiers: ['value'],
                        },
                    ],
                    groups: [
                        'type-import', // pure `import type`, hoisted to the top
                        'react',
                        'next',
                        'value-builtin',
                        'value-external',
                        'value-internal', // ^@/
                        'value-parent',
                        'value-sibling',
                        'value-index',
                        'side-effect-style',
                        'style', // css
                        'unknown',
                    ],
                },
            ],
            'perfectionist/sort-named-imports': [
                'error',
                {
                    type: 'natural',
                    groups: ['type-import', 'value-import'], // inline `type` first
                },
            ],
        },
    },
]);
