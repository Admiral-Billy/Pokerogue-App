import pluginJs from "@eslint/js";
import globals from "globals";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    ignores: [".config/*", "node_modules/", "dist/", "package.json", "package-log.json", ".gitignore"],
    rules: {
      "no-unused-vars": [
        "error",
        {
          "vars": "local", // checks only that locally-declared variables are used but will allow global variables to be unused
          "args": "all", // checks that all named arguments must be used.
          "caughtErrors": "all", // checks that all named arguments in the error fn handler must be used.
          "argsIgnorePattern": "^_", // all the args starting with `_` are not checked
          "ignoreRestSiblings": false,
          "reportUsedIgnorePattern": false, // this option will report variables that match any of the valid ignore pattern options
        },
      ],
      "indent": ["error", 2], // forces 4 spaces indent in the project
    },
  },
  pluginJs.configs.recommended,
];
