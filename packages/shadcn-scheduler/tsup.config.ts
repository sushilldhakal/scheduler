import { defineConfig } from "tsup"

export default defineConfig({
  entry: {
    index: "src/index.ts",
    tv: "src/domains/tv/index.tsx",
    default: "src/domains/default/index.tsx",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
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
    "react-day-picker",
    "class-variance-authority",
    "clsx",
    "tailwind-merge",
  ],
  treeshake: true,
  minify: false,
})
