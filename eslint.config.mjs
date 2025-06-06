import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/dist/", "**/node_modules/"]), {
    extends: compat.extends("eslint:recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        prettier,
    },

    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
        globals: {
            ...globals.node,
            ...globals.jest,
        },

        parser: tsParser,
        ecmaVersion: 2022,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
        
    },

    ignores: ["**/*.d.ts", "**/generated/**/*"],

    rules: {
        "prettier/prettier": "error",
        "@typescript-eslint/no-unused-vars": ["error", {
            "varsIgnorePattern": "^_",
            "argsIgnorePattern": "^_",
            "ignoreRestSiblings": true,
            "enumsIgnorePattern": "^[A-Z_]+$"  // Ignore enum values that are all caps
        }],
        "@typescript-eslint/explicit-function-return-type": "warn",
        "@typescript-eslint/no-explicit-any": "warn",
        "no-console": "warn",
    },
}]);