# Phase 7–10 Roadmap

Status: **Done** = implemented; **Partial** = partly done; **Todo** = not started.

---

## Phase 7 — Architecture Redesign

### Type System
| ID | Description | Status |
|----|-------------|--------|
| P7-01 | Rename Shift → Block | Done |
| P7-02 | Category + Employee → Resource | Done |
| P7-03 | Update imports, exports, props, vars after rename | Done |
| P7-04 | meta: TMeta on Block | Done |
| P7-05 | meta: TMeta on Resource | Done |
| P7-06 | Block date → ISO string (no bare Date in API) | Done |
| P7-07 | strict: true + noUncheckedIndexedAccess | Partial (strict done) |
| P7-08 | Fix TS errors from strict mode | Todo |
| P7-09 | JSX.Element → React.ReactElement | Todo |
| P7-10 | Replace any with proper types | Todo |

### Config System
| ID | Description | Status |
|----|-------------|--------|
| P7-11 | createSchedulerConfig() in config.ts | Done |
| P7-12 | Presets: roster \| tv \| conference \| festival \| healthcare \| gantt \| venue | Partial (default, tv) |
| P7-13 | Each preset: views, labels, snap, time range, flags | Done for default/tv |
| P7-14 | createSchedulerConfig({ preset: 'tv' }) returns full config | Done |

### File Structure
| ID | Description | Status |
|----|-------------|--------|
| P7-15 | src/core/ — GridView, context, constants, utils | Done |
| P7-16 | src/hooks/ — useScrollToNow, useDrag, useResize, useTouch | Partial (useScrollToNow in core/hooks) |
| P7-17 | src/domains/ — tv/, roster/, conference/, festival/, healthcare/, gantt/, venue/ | Partial (default, tv) |
| P7-18 | src/presets/ — one config file per domain | Todo |

### Compound Components
| ID | Description | Status |
|----|-------------|--------|
| P7-19 | Scheduler.roster | Partial (SchedulerDefault) |
| P7-20 | Scheduler.tv | Partial (SchedulerTV) |
| P7-21–25 | Scheduler.conference, .festival, .healthcare, .gantt, .venue | Todo |
| P7-26 | Scheduler namespace object | Todo |
| P7-27 | views prop on domain components | Partial (enabledViews in config) |
| P7-28 | ViewTabs reads views prop | Done |
| P7-29 | src/all.ts — opt-in bundle | Todo |

### Distribution
| ID | Description | Status |
|----|-------------|--------|
| P7-30 | tsup multiple entry points per domain | Partial (index, tv, default) |
| P7-31 | package.json exports map | Partial |
| P7-32 | Per-domain registry JSON | Partial (scheduler, scheduler-tv) |
| P7-33 | Root registry references all | Partial |
| P7-34 | Test npx shadcn add scheduler/tv | Todo |
| P7-35 | Demo app Scheduler.roster syntax | Todo |
| P7-36 | README compound API examples | Partial |

---

## Phase 8 — New Views
| ID | Description | Status |
|----|-------------|--------|
| P8-01–08 | TimelineView | Done (basic) |
| P8-09–17 | GanttView | Todo |
| P8-18–21 | NowView | Todo |
| P8-22–25 | RunningOrderView | Todo |

---

## Phase 9 — Render Slots & Extensibility
| ID | Description | Status |
|----|-------------|--------|
| P9-01–15 | Render slots (block, badge, tooltip, resource header, etc.) | Partial (block, resourceHeader) |
| P9-16–20 | Callbacks (meta flow, onBlockCreate, onBlockDelete, etc.) | Todo |

---

## Phase 10 — Domain Features
| ID | Description | Status |
|----|-------------|--------|
| P10-01–08 | TV & Broadcasting | Todo |
| P10-09–14 | Events & Conferences | Todo |
| P10-15–21 | Music Festivals | Todo |
| P10-22–27 | Healthcare | Todo |
| P10-28–35 | Logistics, Live Event Dashboard | Todo |
| P10-36–43 | Workforce / Roster | Todo |
| P10-44–53 | Venue, Gantt | Todo |
