import { defineConfig } from "tsup"
import { copyFileSync } from "fs"

// Build in two passes:
// 1. Core + domain entries WITH full DTS (these need types)
// 2. View entries WITHOUT DTS (they re-export from core — types are inherited)
export default defineConfig([
  {
    // Core and domain entries — full build with DTS
    entry: {
      index:      "src/index.ts",
      default:    "src/domains/default/index.tsx",
      tv:         "src/domains/tv/index.tsx",
      conference: "src/domains/conference/index.tsx",
      festival:   "src/domains/festival/index.tsx",
      healthcare: "src/domains/healthcare/index.tsx",
      gantt:      "src/domains/gantt/index.tsx",
      venue:      "src/domains/venue/index.tsx",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    external: [
      "react", "react-dom", "lucide-react", "tailwindcss",
      "@radix-ui/react-popover", "@radix-ui/react-tabs",
      "@radix-ui/react-toggle-group", "@radix-ui/react-checkbox",
      "@radix-ui/react-slot", "react-day-picker",
      "class-variance-authority", "clsx", "tailwind-merge",
      "html2canvas", "jspdf",
    ],
    treeshake: false,
    minify: false,
    onSuccess: async () => {
      copyFileSync("src/scheduler-tokens.css", "dist/scheduler-tokens.css")
    },
  },
  {
    // View-specific entry points — JS only, no DTS (users get types from index)
    entry: {
      "views/timeline": "src/views/timeline/index.tsx",
      "views/week":     "src/views/week/index.tsx",
      "views/day":      "src/views/day/index.tsx",
      "views/month":    "src/views/month/index.tsx",
      "views/year":     "src/views/year/index.tsx",
      "views/list":     "src/views/list/index.tsx",
    },
    format: ["cjs", "esm"],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: false,
    external: [
      "react", "react-dom", "lucide-react", "tailwindcss",
      "@radix-ui/react-popover", "@radix-ui/react-tabs",
      "@radix-ui/react-toggle-group", "@radix-ui/react-checkbox",
      "@radix-ui/react-slot", "react-day-picker",
      "class-variance-authority", "clsx", "tailwind-merge",
      "html2canvas", "jspdf",
    ],
    treeshake: false,
    minify: false,
  },
])
