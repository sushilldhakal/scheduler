import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, "../../docs"),
    emptyOutDir: true,
  },
  base: "/scheduler/",
  server: {
    fs: {
      allow: ["..", "../.."],
    },
  },
})
