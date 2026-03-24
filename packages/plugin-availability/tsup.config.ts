import { defineConfig } from "tsup"
import { createTsupConfig } from "../../tsup.config.base"

export default defineConfig(
  createTsupConfig({
    outDir: "../../dist/plugin-availability",
    entry: ["src/index.ts"],
  })
)