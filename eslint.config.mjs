import { typescriptConfig, globals } from "@openally/config.eslint";

export default typescriptConfig({
  languageOptions: {
    globals: {
      ...globals.browser
    }
  }
});
