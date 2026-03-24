import { defineConfig, type Options } from "tsup"

export const createTsupConfig = (options: Partial<Options> = {}): Options => {
  return {
    format: ["cjs", "esm"],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    minify: false,
    external: [
      "react",
      "react-dom",
      "lucide-react",
      "tailwindcss",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toggle-group",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-slot",
      "@radix-ui/react-context-menu",
      "react-day-picker",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "html2canvas",
      "jspdf",
      "@tanstack/react-virtual",
      "react-resizable-panels"
    ],
    ...options,
  }
}

export default defineConfig(createTsupConfig())