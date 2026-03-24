# Scheduler Monorepo Structure

This document describes the monorepo workspace structure for the shadcn-scheduler library refactor.

## Overview

The monorepo is organized into modular packages that enable tree-shaking and selective imports:

- **Core Infrastructure**: Headless engine, React shell, and grid rendering foundation
- **View Packages**: Individual calendar view implementations
- **Plugin Packages**: Optional feature extensions
- **Preset Packages**: Domain-specific configurations
- **Compatibility Package**: Backward compatibility bundle

## Package Structure

### Core Infrastructure

```
packages/
├── core/                    # @shadcn-scheduler/core
│   ├── src/
│   │   ├── types.ts        # Core type definitions
│   │   ├── constants.ts    # Shared constants
│   │   ├── layout/         # Layout and geometry calculations
│   │   │   ├── geometry.ts
│   │   │   └── dragEngine.ts
│   │   └── utils/          # Pure utility functions
│   │       ├── dateUtils.ts
│   │       ├── packing.ts
│   │       ├── recurrence.ts
│   │       └── timezone.ts
│   └── package.json        # Zero React dependencies
│
├── shell/                   # @shadcn-scheduler/shell
│   ├── src/
│   │   ├── SchedulerProvider.tsx  # React context provider
│   │   ├── SchedulerShell.tsx     # Main container component
│   │   ├── PluginManager.tsx      # Plugin system
│   │   ├── SlotRenderer.tsx       # Plugin slot rendering
│   │   ├── types.ts               # Shell type definitions
│   │   └── hooks.ts               # Custom hooks
│   └── package.json               # Peer deps: core, react
│
└── grid-engine/             # @shadcn-scheduler/grid-engine
    ├── src/
    │   ├── GridBase.tsx     # Foundation grid component
    │   ├── GridCell.tsx     # Individual cell rendering
    │   ├── GridHeader.tsx   # Time/date headers
    │   ├── DragHandler.tsx  # Drag and drop interactions
    │   ├── ScrollManager.tsx # Scroll synchronization
    │   ├── GridViewBase.tsx # Abstract base class
    │   ├── types.ts         # Grid type definitions
    │   └── utils.ts         # Grid utilities
    └── package.json         # Peer deps: core, shell, react
```

### View Packages

```
packages/
├── view-day/               # @shadcn-scheduler/view-day
├── view-week/              # @shadcn-scheduler/view-week
├── view-timeline/          # @shadcn-scheduler/view-timeline
├── view-month/             # @shadcn-scheduler/view-month
├── view-year/              # @shadcn-scheduler/view-year
├── view-list/              # @shadcn-scheduler/view-list
└── view-kanban/            # @shadcn-scheduler/view-kanban
```

**Grid-based views** (day, week, timeline) depend on:
- `@shadcn-scheduler/core` (peer)
- `@shadcn-scheduler/shell` (peer)
- `@shadcn-scheduler/grid-engine` (peer)

**List-based views** (month, year, list, kanban) depend on:
- `@shadcn-scheduler/core` (peer)
- `@shadcn-scheduler/shell` (peer)

### Plugin Packages

```
packages/
├── plugin-markers/         # @shadcn-scheduler/plugin-markers
├── plugin-dependencies/    # @shadcn-scheduler/plugin-dependencies
├── plugin-histogram/       # @shadcn-scheduler/plugin-histogram
├── plugin-availability/    # @shadcn-scheduler/plugin-availability
├── plugin-export/          # @shadcn-scheduler/plugin-export
├── plugin-recurrence/      # @shadcn-scheduler/plugin-recurrence
└── plugin-audit/           # @shadcn-scheduler/plugin-audit
```

All plugins depend on:
- `@shadcn-scheduler/core` (peer)
- `@shadcn-scheduler/shell` (peer)

### Preset Packages

```
packages/
├── preset-healthcare/      # @shadcn-scheduler/preset-healthcare
│   └── dependencies: view-day, view-week, plugin-histogram, plugin-availability
├── preset-tv/              # @shadcn-scheduler/preset-tv
│   └── dependencies: view-timeline, plugin-markers, plugin-dependencies
└── preset-conference/      # @shadcn-scheduler/preset-conference
    └── dependencies: view-day, view-week, view-list, plugin-markers
```

### Compatibility Package

```
packages/
└── scheduler/              # @shadcn-scheduler/scheduler
    └── dependencies: ALL views and plugins (for backward compatibility)
```

## Build System

### Shared Configuration

- **Root tsconfig.json**: Shared TypeScript configuration with path mapping
- **tsup.config.base.ts**: Shared build configuration with tree-shaking enabled
- **Package-level configs**: Individual tsconfig.json and tsup.config.ts files

### Build Scripts

```bash
# Build core infrastructure
npm run build:packages

# Build view packages
npm run build:views

# Build plugin packages
npm run build:plugins

# Build preset packages
npm run build:presets

# Build compatibility package
npm run build:scheduler

# Build everything
npm run build:all
```

### Key Features

1. **Tree-shaking enabled**: All packages configured with `treeshake: true`
2. **ES modules**: Named exports for optimal tree-shaking
3. **Peer dependencies**: Proper dependency management to avoid duplication
4. **Side effects**: Correctly marked as `false` unless CSS imports required
5. **TypeScript declarations**: Generated for all packages

## Usage Examples

### Minimal Import (Tree-shaken)
```typescript
import { DayView } from '@shadcn-scheduler/view-day'
import { SchedulerProvider } from '@shadcn-scheduler/shell'
// Only day view code is bundled
```

### Preset Import
```typescript
import { HealthcarePreset } from '@shadcn-scheduler/preset-healthcare'
// Includes day view, week view, histogram plugin, availability plugin
```

### Backward Compatibility
```typescript
import { Scheduler } from '@shadcn-scheduler/scheduler'
// All views and plugins included (existing API)
```

## Development Workflow

1. **Core changes**: Start with `packages/core` for headless logic
2. **Shell changes**: Update `packages/shell` for React integration
3. **View development**: Create/modify individual view packages
4. **Plugin development**: Create/modify individual plugin packages
5. **Testing**: Each package has independent test suite
6. **Building**: Use workspace-aware build commands

## Migration Path

1. **Phase 1**: Extract core engine (zero React dependencies)
2. **Phase 2**: Create shell and grid-engine packages
3. **Phase 3**: Extract individual view packages
4. **Phase 4**: Create plugin system packages
5. **Phase 5**: Build preset packages
6. **Phase 6**: Maintain backward compatibility bundle
7. **Phase 7**: Validate tree-shaking effectiveness

This structure enables consumers to import only what they need while maintaining full backward compatibility.