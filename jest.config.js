const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    roots: [
        '<rootDir>/src',
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
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
    globals: {
        'ts-jest': {
            tsConfig: './tsconfig.test.json',
            stringifyContentPathRegex: '\\.html$',
            astTransformers: [
                'jest-preset-angular/build/InlineFilesTransformer',
                'jest-preset-angular/build/StripStylesTransformer',
            ],
        },
    },
};
