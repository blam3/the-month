module.exports = {
  modulePathIgnorePatterns: ['<rootDir>/artifacts/', '<rootDir>/site/'],
  preset: 'ts-jest', testEnvironment: 'jsdom',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'CommonJS', moduleResolution: 'Node', resolveJsonModule: true, esModuleInterop: true, strict: false } }] }
};
