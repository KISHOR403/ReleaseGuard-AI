/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@releaseguard/shared$': '<rootDir>/packages/shared/src/index.ts',
    '^@releaseguard/ai$': '<rootDir>/packages/ai/src/index.ts',
    '^@releaseguard/change-intelligence$': '<rootDir>/packages/change-intelligence/src/index.ts',
  },
  testMatch: [
    '<rootDir>/packages/**/__tests__/**/*.spec.ts',
    '<rootDir>/tests/**/*.spec.ts',
  ],
  testTimeout: 15000,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.base.json',
        diagnostics: {
          ignoreCodes: [151002],
        },
      },
    ],
  },
};
