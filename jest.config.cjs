const config = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["<rootDir>/**/*.test.(js|jsx|cjs)"],
  transform: {
    "^.+\\.(js|jsx|cjs)$": ["babel-jest", { configFile: require.resolve("./babel.config.jest.cjs") }],
  },
  transformIgnorePatterns: ["/node_modules/", "\\.pnp\\.[^\\/]+$"],
  collectCoverageFrom: [
    "lib/**/*.{js,jsx}",
    "components/**/*.{js,jsx}",
    "!**/*.d.ts",
  ],
};

module.exports = config;