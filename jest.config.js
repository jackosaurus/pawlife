module.exports = {
  projects: [
    {
      preset: 'jest-expo/ios',
      setupFilesAfterEnv: ['@testing-library/react-native/matchers'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      testPathIgnorePatterns: ['/node_modules/', '/.claude/', '/__tests__/smoke/'],
    },
  ],
};
