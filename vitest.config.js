import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/unit/**/*.test.js",
      "tests/rag-eval/**/*.test.js",
      "tests/integration/**/*.test.js",
    ],
    setupFiles: ["tests/integration/setup-env.js"],
    fileParallelism: false,
  },
});
