import * as fs from "fs"

// https://github.com/francoismassart/eslint-plugin-tailwindcss/pull/381
// import eslintPluginTailwindcss from "eslint-plugin-tailwindcss"
import eslintPluginImport from "eslint-plugin-import"
import eslintPluginNext from "@next/eslint-plugin-next"
import eslintPluginStorybook from "eslint-plugin-storybook"
import typescriptEslint from "typescript-eslint"

const eslintIgnore = [
  ".git/",
  ".next/",
  "node_modules/",
  "dist/",
  "build/",
  "coverage/",
  "*.min.js",
  "*.config.js",
  "*.d.ts",
]

const config = typescriptEslint.config(
  {
    ignores: eslintIgnore,
  },
  ...eslintPluginStorybook.configs["flat/recommended"],
  //  https://github.com/francoismassart/eslint-plugin-tailwindcss/pull/381
  // ...eslintPluginTailwindcss.configs["flat/recommended"],
  typescriptEslint.configs.recommended,
  eslintPluginImport.flatConfigs.recommended,
  {
    plugins: {
      "@next/next": eslintPluginNext,
    },
    rules: {
      ...eslintPluginNext.configs.recommended.rules,
      ...eslintPluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    settings: {
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl", "cn", "cva"],
      },

      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "sort-imports": [
        "warn",
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],
      "import/order": "warn"
    },
  }
)

function getDirectoriesToSort() {
  const ignoredSortingDirectories = [".git", ".next", ".vscode", "node_modules"]
  return fs
    .readdirSync(process.cwd())
    .filter((file) => fs.statSync(process.cwd() + "/" + file).isDirectory())
    .filter((f) => !ignoredSortingDirectories.includes(f))
}

export default config
