module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/server.ts',
        '!src/scripts/**',
    ],
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    testTimeout: 10000,
    verbose: true,
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/dist/',
    ],
};
