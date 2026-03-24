import { defineConfig } from "tsup"
import { createTsupConfig } from "../../tsup.config.base"

export default defineConfig(
  createTsupConfig({
    entry: ["src/index.ts"],
    external: ["@shadcn-scheduler/core"],
  })
)