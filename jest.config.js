const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "node"],
  moduleDirectories: ["node_modules", "src"],
  roots: ["<rootDir>/tests", "<rootDir>/src"],
};