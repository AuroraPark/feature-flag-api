import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',

  testEnvironment: 'node',

  verbose: true,  // 테스트 설명 출력

  testMatch: ['<rootDir>/tests/**/*.test.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: [],

  testTimeout: 30000,

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/database/**',
    '!src/**/*.swagger.ts',
  ],

  clearMocks: true,
};

export default config;