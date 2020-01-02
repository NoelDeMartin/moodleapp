const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    roots: [
        '<rootDir>/tests/unit',
    ],
    testMatch: [
        '**/?(*.)test.ts',
    ],
    transform: {
        '^.+\\.(ts|html)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!@ionic-native|@ionic|ionic-angular)',
    ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
    globals: {
        'ts-jest': {
            tsConfig: './tsconfig.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers: [
                'jest-preset-angular/build/InlineFilesTransformer',
                'jest-preset-angular/build/StripStylesTransformer',
            ],
        },
    },
};
