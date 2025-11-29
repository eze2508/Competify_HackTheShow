module.exports = {
  testEnvironment: "node",
  rootDir: ".",
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: ["./tests/setup.js"],
  moduleNameMapper: {
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@db/(.*)$": "<rootDir>/src/db/$1"
  }
};
