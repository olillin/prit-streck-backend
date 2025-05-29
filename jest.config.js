/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  testMatch: ['**/test/unit/**/*.spec.ts'],
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
};