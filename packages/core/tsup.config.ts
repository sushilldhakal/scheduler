import { defineConfig } from "tsup"
import { createTsupConfig } from "../../tsup.config.base"

export default defineConfig(
  createTsupConfig({
    outDir: "../../dist/core",
    entry: ["src/index.ts"],
    // Core package has no external dependencies beyond Node.js built-ins
    external: [],
  })
)