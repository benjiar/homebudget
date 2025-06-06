module.exports = {
  root: true,
  extends: [
    "../config/eslint-preset.js",
    "plugin:react/recommended",          // Recommended React linting rules
    "plugin:react/jsx-runtime",        // For new JSX transform (React 17+)
    "plugin:jsx-a11y/recommended",     // Accessibility rules for JSX
  ],
  parserOptions: {
    project: "./tsconfig.json",         // Point to the tsconfig.json in packages/ui
    tsconfigRootDir: __dirname,
  },
  settings: {
    react: {
      version: "detect",                // Automatically detect React version
    },
  },
  rules: {
    // Add any package-specific rules or overrides here
    // e.g., "react/prop-types": "off" if using TypeScript for prop types
  },
  ignorePatterns: [".eslintrc.js", "dist/", "node_modules/"],
}; 