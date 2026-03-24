import { defineConfig } from "tsup"
import { createTsupConfig } from "../../tsup.config.base"

export default defineConfig(
  createTsupConfig({
    outDir: 'dist',
    entry: ["src/index.ts"],
  })
)