module.exports = {
  root: true,
  extends: [
    "../../packages/config/eslint-preset.js",
    "next/core-web-vitals"
  ],
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  settings: {
    next: {
      rootDir: __dirname,
    },
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "react/react-in-jsx-scope": "off",
  },
  ignorePatterns: [".eslintrc.js", "dist/", "node_modules/", ".next/"]
};