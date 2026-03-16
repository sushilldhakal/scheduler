import { describe, it, expect } from "vitest"
import { createSchedulerConfig, type SchedulerPresetName } from "./config"

describe("createSchedulerConfig", () => {
  it("returns default labels when no preset", () => {
    const config = createSchedulerConfig({})
    expect(config.labels?.category).toBe("Category")
    expect(config.labels?.employee).toBe("Employee")
  })

  it("preset tv sets category to Channel", () => {
    const config = createSchedulerConfig({ preset: "tv" })
    expect(config.labels?.category).toBe("Channel")
    expect(config.labels?.employee).toBe("Program")
  })

  it("overrides take precedence over preset", () => {
    const config = createSchedulerConfig({
      preset: "tv",
      labels: { category: "Custom" },
    })
    expect(config.labels?.category).toBe("Custom")
    expect(config.labels?.employee).toBe("Program")
  })

  it("all 8 presets return valid config", () => {
    const presets: SchedulerPresetName[] = [
      "roster",
      "default",
      "tv",
      "conference",
      "festival",
      "healthcare",
      "gantt",
      "venue",
    ]
    for (const preset of presets) {
      const config = createSchedulerConfig({ preset })
      expect(config).toBeDefined()
      expect(config.labels).toBeDefined()
      expect(config.defaultSettings).toBeDefined()
    }
  })
})
