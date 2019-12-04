const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
    preset: 'jest-preset-angular',
    roots: [
        '<rootDir>/src',
    ],
    testMatch: [
        '**/?(*.)test.ts',
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!@ionic-native|@ionic)',
    ],
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/src/' }),
    globals: {
        'ts-jest': {
            tsConfig: './tsconfig.test.json',
        },
    },
};
