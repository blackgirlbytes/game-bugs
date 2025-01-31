const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  transformIgnorePatterns: [
    'node_modules/(?!(lucide-react|recharts)/)'
  ],
  setupFiles: ['<rootDir>/jest.polyfills.js']
}

module.exports = createJestConfig(customJestConfig) 