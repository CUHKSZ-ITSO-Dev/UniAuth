const { defineConfig } = require("orval");

module.exports = defineConfig({
  uniauth: {
    input: "http://localhost:8000/api.json",
    output: {
      mode: "tags",
      target: "src/apis/uniauth.ts",
      client: "axios",
      namingConvention: "PascalCase",
      override: {
        mutator: {
          path: "./src/utils/api-mutator.ts",
          name: "customApiMutator",
        },
      },
    },
  },
});
