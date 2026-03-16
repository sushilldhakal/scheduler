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
| P7-27 | views prop (Record<ViewKey, boolean>) | Done |
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

---

## Phase 11 — Touch, Mobile & Keyboard

Focus: **GridView**, **Scheduler**. (Can run in parallel with Phase 12.)

### Touch Interactions
| ID | Description | Status |
|----|-------------|--------|
| P11-01 | Rebuild drag system on pointer events API — works on mouse, touch, stylus; add touch-specific behaviours (momentum, larger hit targets) | Done |
| P11-02 | Tap block → open detail as bottom sheet on mobile (innerWidth < 768), popover on desktop | Done |
| P11-03 | Long press empty slot → create new block. longPressDelay: 500ms on pointerdown on empty cells; cancel on pointermove beyond 8px | Done |
| P11-04 | Drag block → momentum snap: on pointerup snap to nearest snapMinutes interval | Done |
| P11-05 | Resize hit targets minimum 20px wide on touch | Done |
| P11-06 | Swipe left/right on grid background (deltaX > 50px, deltaY < 30px) → navigate(1) / navigate(-1) | Done |
| P11-07 | Pinch zoom: two-finger pinch → zoom levels (0.5 / 0.75 / 1 / 1.25 / 1.5 / 2); track two pointer IDs | Done |
| P11-08 | Two-finger scroll: when two pointers detected, disable drag and allow native scroll | Done |

### Responsive Layout
| ID | Description | Status |
|----|-------------|--------|
| P11-09 | Mobile (<768px): one resource column at a time; horizontal swipe between resources in day view | Done |
| P11-10 | Mobile: ViewTabs in fixed bottom bar; header collapses to date + today button | Done |
| P11-11 | Tablet (768–1200px): StaffPanel as slide-in drawer, triggered by button | Done |
| P11-12 | Desktop (>1200px): existing layout, staff panel always visible | Done |
| P11-13 | Safe area: pb-[env(safe-area-inset-bottom)], pt-[env(safe-area-inset-top)] on root | Done |

### Keyboard Navigation
| ID | Description | Status |
|----|-------------|--------|
| P11-14 | Tab moves focus between blocks; tabIndex={0} on blocks; useRef + focus() | Done |
| P11-15 | ArrowLeft/Right on focused block → move by one snapMinutes; ArrowUp/Down → prev/next resource row | Done |
| P11-16 | Enter on focused block → open detail (same as click) | Done |
| P11-17 | Escape → close modal, panel, popover | Done |
| P11-18 | Delete/Backspace on focused block → remove after window.confirm() | Done |
| P11-19 | Ctrl+Z undo: Block[][] history in Scheduler, max 20; pop and onShiftsChange | Done |
| P11-20 | Ctrl+C → copy focused block to copiedBlock state | Done |
| P11-21 | Ctrl+V → paste copiedBlock at focused date/resource with nextUid() | Done |
| P11-22 | ArrowLeft/Right when no block focused → navigate(-1) / navigate(1) | Done |
| P11-23 | Focus ring: focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none on interactive elements | Done |
| P11-24 | ARIA: role="gridcell" on time slots; role="button" + aria-label on blocks; aria-label on icon-only buttons | Done |
| P11-25 | aria-live="polite" region to announce e.g. "Alice B. moved to Monday 9am–5pm" | Done |

---

## Phase 12 — Visual Polish

Focus: **CSS classes**, **render logic**. (Can run in parallel with Phase 11.)

### Animations
| ID | Description | Status |
|----|-------------|--------|
| P12-01 | Block creation: scale-in CSS animation; @keyframes scaleIn; animate new block IDs for one frame | Done |
| P12-02 | Block deletion: fade-out 150ms then remove; deletingIds Set in GridView | Done |
| P12-03 | View switch: transition-opacity duration-150; isTransitioning state | Done |
| P12-04 | Date navigation: data-direction on date label + translate-x animation | Done |
| P12-05 | Drag lift: pointerdown → scale-[1.02] shadow-lg z-20 on dragged block | Done |
| P12-06 | Drag drop: pointerup → brief transition-transform spring-back | Done |
| P12-07 | Drag ghost: match real block at 80% opacity, ring-2 ring-primary/50 | Done |
| P12-08 | Drop target: valid cell gets bg-primary/10 ring-1 ring-primary/30 | Done |
| P12-09 | Zoom: transition-all duration-200 on grid container for HOUR_W | Done |

### Tooltips
| ID | Description | Status |
|----|-------------|--------|
| P12-10 | Block hover tooltip: 400ms delay, Popover with title, time range, resource, status, meta; dismiss on pointerleave | Done |
| P12-11 | Resource header tooltip: total blocks count and total hours for view period | Done |
| P12-12 | Time slot tooltip: hover shows fmt12(hour) | Done |

### Loading & Empty States
| ID | Description | Status |
|----|-------------|--------|
| P12-13 | isLoading prop: skeleton blocks (grey, animate-pulse) at same positions | Done |
| P12-14 | Skeleton blocks use packShifts + getCategoryRowHeight for layout match | Done |
| P12-15 | Empty resource row: dashed border, + icon, "Add {labels.shift}" → onAddShift | Done |
| P12-16 | Empty day in month view: bg-muted/30, + on hover | Done |
| P12-17 | Empty list view: "No {labels.shift}s in this period" + add button | Done |
| P12-18 | Empty year view: months with no blocks → text-muted-foreground | Done |

### Interaction Quality
| ID | Description | Status |
|----|-------------|--------|
| P12-19 | Resize handles: opacity-0 group-hover:opacity-100; touch: always visible min 20px | Done |
| P12-20 | Hide resize on blocks narrower than 48px | Done |
| P12-21 | Conflict: ring-2 ring-destructive border-destructive + ⚠ badge | Done |
| P12-22 | Conflict tooltip: "Overlaps with X other block(s)" | Done |
| P12-23 | Prevent drop into conflicting position; red highlight and revert if conflict | Done |
| P12-24 | Outside working hours: border-warning ring + tooltip | Partial (dashed bg already; tooltip optional) |
| P12-25 | Draft blocks: border-dashed opacity-90 + draft badge | Done |
| P12-26 | Live block glow: current time in [startH,endH] today → shadow primary ring | Done |
| P12-27 | Past blocks: date < today or endH < nowH → opacity-60 | Done |

### Pixel Perfection
| ID | Description | Status |
|----|-------------|--------|
| P12-28 | Now line: hsl(var(--destructive)); animate-pulse dot; setInterval 60s for nowH | Done |
| P12-29 | Block title: truncate; below 60px hide title, show colour strip only | Done |
| P12-30 | Spacing audit: hardcoded px → 4px scale (4,8,12,16,20,24,32) | Partial |
| P12-31 | Icon alignment: flex items-center justify-center on button parents | Done (Button has it) |
| P12-32 | Micro-interactions: transition-colors duration-150 on Button; hover:bg-accent on ListView rows | Done |
| P12-33 | Dark mode audit: no hardcoded #fff/#000; use CSS variables | Partial |
| P12-34 | High contrast: @media (forced-colors: active) for borders and focus | Done |

---

## Phase 13 — Performance

Run **after** Phase 11 and 12.

| ID | Description | Status |
|----|-------------|--------|
| P13-01 | Install @tanstack/react-virtual (dev/peer) for virtualisation | Done |
| P13-02 | Virtual row rendering in GridView: useVirtualizer, viewport + 2 row overscan | Todo |
| P13-03 | Virtual column rendering in GridView: useVirtualizer for time columns | Todo |
| P13-04 | Same virtualisation in TimelineView rows | Todo |
| P13-05 | Benchmark: ?perf=true loads 10k blocks, 200 resources, live FPS counter (rAF delta) | Done |
| P13-06 | useMemo audit: categoryTops, categoryHeights, filteredEmployees, dayShiftsByEmployee | Partial |
| P13-07 | useCallback audit: event handlers in GridView and Scheduler | Partial |
| P13-08 | React.memo on GridView, TimelineView, MonthView, ListView, YearView with custom compare | Todo |
| P13-09 | Debounce onVisibleRangeChange 100ms | Todo |
| P13-10 | Bundle size: bundlephobia/du; document in CHANGELOG; target <50kb gzipped per entry | Todo |
| P13-11 | tsup splitting: true for code splitting; verify tree shaking | Todo |

---

## Phase 14 — Internationalisation & Export

Run **after** Phase 13.

### Internationalisation
| ID | Description | Status |
|----|-------------|--------|
| P14-01 | timezone?: string in SchedulerConfig (e.g. America/New_York); display in timezone via Intl | Todo |
| P14-02 | src/core/utils/timezone.ts: formatInTimezone(isoDate, hour, tz) with Intl.DateTimeFormat | Todo |
| P14-03 | All time display (fmt12, fmtHourOpt) via timezone formatter when config.timezone set | Todo |
| P14-04 | isRTL?: boolean; dir="rtl" on root; rtl: variant for left/right | Todo |
| P14-05 | locale?: string for toLocaleDateString and month/day names (Intl) | Todo |
| P14-06 | firstDay?: 0 \| 1 (Sunday/Monday start); pass to getWeekDates | Todo |

### Export
| ID | Description | Status |
|----|-------------|--------|
| P14-07 | PDF: jspdf + html2canvas (optional peer); exportToPDF(containerRef, filename) in utils/export.ts | Todo |
| P14-08 | Image: exportToImage(containerRef, filename) PNG via html2canvas | Todo |
| P14-09 | CSV: exportToCSV(blocks, filename); flatten meta columns | Todo |
| P14-10 | Export buttons in SchedulerSettings: PDF, Image, CSV | Todo |

### Integration
| ID | Description | Status |
|----|-------------|--------|
| P14-11 | readOnly?: boolean — disable drag/resize/click/add; view-only blocks; pointer-events-none overlay | Todo |
| P14-12 | Webhook callbacks: onBlockCreate, onBlockDelete, onBlockMove, onBlockResize, onBlockPublish with full Block | Todo |
| P14-13 | useAuditTrail hook: log (AuditEntry[]), clearLog; action, blockId, before/after; optional onAuditEvent | Todo |

---

## Phase 15 — Testing, DX & Distribution

Run **after** Phase 14.

### Vitest Unit Tests
| ID | Description | Status |
|----|-------------|--------|
| P15-01 | Install vitest, @testing-library/react in packages/shadcn-scheduler devDependencies | Todo |
| P15-02 | vitest.config.ts: environment jsdom, globals true | Todo |
| P15-03 | packing.test.ts: packShifts 0–3 overlaps; findConflicts; getCategoryRowHeight | Todo |
| P15-04 | config.test.ts: createSchedulerConfig defaults, preset 'tv', overrides, all 7 presets | Todo |
| P15-05 | constants.test.ts: fmt12, toDateISO/parseBlockDate round-trip, sameDay Date/string | Todo |
| P15-06 | constants.test.ts: getWeekDates 7 days Mon; snapH(1.3)→1.5 with SNAP=0.5 | Todo |
| P15-07 | useScrollToNow.test.ts: scrollToNow sets scrollLeft correctly | Done |
| P15-08 | npm test green; fix failures | Todo |
| P15-09 | "test": "vitest run", "test:watch": "vitest" in package.json | Todo |

### Demo Site
| ID | Description | Status |
|----|-------------|--------|
| P15-10 | Hash routing: react-router-dom; #/, #/roster, #/tv, #/conference, etc. | Todo |
| P15-11 | Scenario switcher in demo header: tab bar with domain icons | Todo |
| P15-12 | Rich test data per domain in testData.ts (TV, Conference, Festival, Healthcare, Gantt) | Todo |
| P15-13 | Each route renders `Scheduler.[domain]` with preset + test data | Todo |
| P15-14 | Dark/light toggle persisted to localStorage | Todo |
| P15-15 | Demo header: product pitch copy; remove debug text | Todo |
| P15-16 | "View source" link in footer → GitHub repo | Todo |

### Documentation
| ID | Description | Status |
|----|-------------|--------|
| P15-17 | README: compound API examples (Scheduler.roster, .tv, .conference) | Todo |
| P15-18 | PRESETS.md: all 7 presets, views, labels, flags | Todo |
| P15-19 | RENDER-SLOTS.md: each slot signature + example | Todo |
| P15-20 | META-EXTENSION.md: Block TMeta, Resource TMeta, worked example | Todo |
| P15-21 | CHANGELOG v1.0.0: full breaking changes list | Todo |
| P15-22 | ROADMAP: mark done items from actual code | Todo |

### Registry & Distribution
| ID | Description | Status |
|----|-------------|--------|
| P15-23 | Per-domain registry JSON: scheduler-conference, festival, healthcare, gantt, venue | Todo |
| P15-24 | registry.json includes all domain entries | Todo |
| P15-25 | package.json exports: ./conference, ./festival, ./healthcare, ./gantt, ./venue | Todo |
| P15-26 | Test npx shadcn@latest add with each registry URL | Todo |
| P15-27 | PR to shadcn-ui/ui: directory.json entry with registry URL | Todo |
| P15-28 | Publish v1.0.0 to npm; verify entry points in fresh project | Todo |
| P15-29 | GitHub Sponsors page | Todo |

---
