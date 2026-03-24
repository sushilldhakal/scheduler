# Implementation Plan: Scheduler Monorepo Refactor

## Overview

This implementation plan breaks down the refactoring of the shadcn-scheduler library from a monolithic package into a modular monorepo architecture. The approach follows a 9-phase strategy that extracts the core engine, creates individual view packages, implements a plugin system, and maintains backward compatibility while enabling tree-shaking for optimal bundle sizes.

## Tasks

- [x] 1. Set up monorepo workspace structure
  - Create packages directory with consistent naming convention
  - Set up shared TypeScript configuration and build tooling
  - Configure workspace dependencies and package.json files
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 2. Extract headless core engine
  - [x] 2.1 Create core engine package structure
    - Set up `packages/core` directory with TypeScript configuration
    - Create package.json with zero React dependencies and correct peer deps
    - _Requirements: 1.1, 5.1, 5.2_
  
  - [ ] 2.2 Extract layout mathematics and geometry calculations
    - Move grid calculations, cell positioning, and drag operations to pure functions
    - Implement `layout/geometry.ts` and `layout/dragEngine.ts` modules
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 2.3 Write property test for core engine purity
    - **Property 1: Core Engine Purity**
    - **Validates: Requirements 1.1, 1.3**
  
  - [~] 2.4 Extract conflict detection and recurrence expansion
    - Move packing algorithms and recurrence logic to `utils/` modules
    - Implement timezone and date calculation utilities
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 2.5 Write property test for Node.js compatibility
    - **Property 2: Core Engine Node.js Compatibility**
    - **Validates: Requirements 1.2, 1.4**

- [ ] 3. Create scheduler shell package
  - [~] 3.1 Implement React context provider and state management
    - Create `SchedulerProvider` with shared state and configuration
    - Implement `SchedulerShell` container component
    - _Requirements: 2.1, 3.5_
  
  - [~] 3.2 Build plugin management system
    - Create `PluginManager` for registration and lifecycle management
    - Implement `SlotRenderer` for plugin slot rendering system
    - _Requirements: 3.1, 3.2, 9.3_
  
  - [ ]* 3.3 Write property test for plugin slot system
    - **Property 8: Plugin Slot System**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 4. Extract grid engine for shared rendering
  - [~] 4.1 Create grid engine package from existing GridView component
    - Extract the 4,873-line GridView component into shared package
    - Create `GridBase`, `GridCell`, `GridHeader` components
    - _Requirements: 8.1, 8.2_
  
  - [~] 4.2 Implement drag and scroll management
    - Create `DragHandler` for drag and drop interactions
    - Implement `ScrollManager` for scroll synchronization
    - _Requirements: 8.4_
  
  - [ ]* 4.3 Write property test for grid engine functionality
    - **Property 13: Grid Engine Functionality**
    - **Validates: Requirements 8.1, 8.2, 8.4**

- [~] 5. Checkpoint - Ensure core infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create individual view packages
  - [~] 6.1 Implement grid-based views (day, week, timeline)
    - Create `view-day`, `view-week`, `view-timeline` packages
    - Extend GridViewBase components from grid-engine
    - _Requirements: 2.1, 2.4, 8.3_
  
  - [~] 6.2 Implement list-based views (month, year, list, kanban)
    - Create `view-month`, `view-year`, `view-list`, `view-kanban` packages
    - Use SchedulerShell for non-grid view implementations
    - _Requirements: 2.1, 2.4_
  
  - [ ]* 6.3 Write property test for view component architecture
    - **Property 5: View Component Architecture**
    - **Validates: Requirements 2.1, 2.4, 8.3**
  
  - [ ]* 6.4 Write property test for package dependency configuration
    - **Property 4: Package Dependency Configuration**
    - **Validates: Requirements 2.3, 4.5, 5.1, 5.2, 5.3, 5.4**

- [ ] 7. Implement plugin system packages
  - [~] 7.1 Create core plugin packages
    - Implement `plugin-markers`, `plugin-dependencies`, `plugin-histogram` packages
    - Create standardized plugin interfaces with lifecycle methods
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [~] 7.2 Create additional plugin packages
    - Implement `plugin-availability`, `plugin-export`, `plugin-recurrence`, `plugin-audit`
    - Ensure all plugins are independently installable and tree-shakeable
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [ ]* 7.3 Write property test for plugin interface compliance
    - **Property 9: Plugin Interface Compliance**
    - **Validates: Requirements 3.4, 9.1, 9.2, 9.4**
  
  - [ ]* 7.4 Write property test for plugin system coordination
    - **Property 10: Plugin System Coordination**
    - **Validates: Requirements 3.5, 9.3, 9.5**

- [ ] 8. Configure build system and tree-shaking
  - [~] 8.1 Set up build orchestration with tsup
    - Configure each package with `treeshake: true` and ES modules
    - Set up incremental builds based on package change detection
    - _Requirements: 4.1, 11.1, 11.2_
  
  - [~] 8.2 Configure package exports and side effects
    - Use named exports for all public APIs, avoid default exports
    - Set `sideEffects: false` in package.json unless CSS imports required
    - _Requirements: 4.2, 4.3, 4.5_
  
  - [ ]* 8.3 Write property test for build configuration compliance
    - **Property 6: Build Configuration Compliance**
    - **Validates: Requirements 2.5, 4.1, 7.2, 7.3**
  
  - [ ]* 8.4 Write property test for ES module export pattern
    - **Property 7: ES Module Export Pattern**
    - **Validates: Requirements 4.2, 4.3**

- [ ] 9. Create preset packages for domain-specific configurations
  - [~] 9.1 Implement healthcare and TV scheduling presets
    - Create `preset-healthcare` and `preset-tv` packages
    - Bundle relevant views and plugins with domain-specific configuration
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [~] 9.2 Implement additional preset packages
    - Create `preset-conference` and other domain-specific presets
    - Export single setup functions for easy initialization
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ]* 9.3 Write property test for preset package composition
    - **Property 14: Preset Package Composition**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

- [~] 10. Checkpoint - Ensure modular packages work independently
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create backward compatibility bundle
  - [~] 11.1 Implement scheduler bundle package
    - Create `scheduler` package that exports all views and plugins
    - Maintain existing `Scheduler.roster`, `Scheduler.tv` API structure
    - _Requirements: 6.1, 6.2, 6.4_
  
  - [~] 11.2 Ensure seamless migration compatibility
    - Include all current exports for existing import statements
    - Validate that existing code continues working without modifications
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 11.3 Write property test for backward compatibility preservation
    - **Property 12: Backward Compatibility Preservation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**

- [ ] 12. Implement bundle analysis and validation
  - [~] 12.1 Set up bundle analyzer tooling
    - Configure webpack-bundle-analyzer or similar for size analysis
    - Create automated bundle size regression testing
    - _Requirements: 1.5, 4.4, 11.5_
  
  - [~] 12.2 Validate tree-shaking effectiveness
    - Test that minimal imports show only imported code in bundles
    - Verify 60% bundle size reduction for single-view usage
    - _Requirements: 2.2, 4.4, 13.5_
  
  - [ ]* 12.3 Write property test for tree-shaking effectiveness
    - **Property 3: Tree-Shaking Effectiveness**
    - **Validates: Requirements 1.5, 2.2, 4.4, 8.5, 10.5, 13.5**
  
  - [ ]* 12.4 Write property test for build system orchestration
    - **Property 15: Build System Orchestration**
    - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

- [ ] 13. Create migration tooling
  - [~] 13.1 Build import analysis and suggestion tool
    - Analyze existing imports and suggest optimal package combinations
    - Generate codemod scripts for automatic import transformation
    - _Requirements: 12.1, 12.2_
  
  - [~] 13.2 Implement migration validation
    - Provide bundle size comparison reports before and after migration
    - Validate that migrated code produces equivalent functionality
    - _Requirements: 12.3, 12.4_
  
  - [ ]* 13.3 Write property test for migration tool functionality
    - **Property 16: Migration Tool Functionality**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 14. Performance validation and optimization
  - [~] 14.1 Implement performance benchmarking
    - Create performance tests comparing modular vs monolithic versions
    - Validate that plugin system adds minimal overhead when unused
    - _Requirements: 13.1, 13.2, 13.3_
  
  - [~] 14.2 Optimize bundle sizes and runtime performance
    - Measure and report bundle size improvements for common use cases
    - Ensure core engine maintains or improves performance
    - _Requirements: 13.1, 13.4_
  
  - [ ]* 14.3 Write property test for performance preservation
    - **Property 17: Performance Preservation**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**
  
  - [ ]* 14.4 Write property test for dependency resolution consistency
    - **Property 11: Dependency Resolution Consistency**
    - **Validates: Requirements 5.5, 7.4**

- [ ] 15. Final integration and testing
  - [~] 15.1 Integration testing across all packages
    - Test plugin system with various plugin combinations
    - Validate view rendering with different core configurations
    - Test preset packages with their constituent components
  
  - [~] 15.2 Documentation and migration guides
    - Create step-by-step migration guides with examples
    - Document new modular architecture and usage patterns
    - _Requirements: 12.5_
  
  - [~] 15.3 CI/CD pipeline configuration
    - Set up automated testing for affected packages when dependencies change
    - Configure tree-shaking validation in build pipeline
    - Generate TypeScript declarations for all public APIs
    - _Requirements: 11.3, 11.4, 11.5_

- [~] 16. Final checkpoint - Ensure complete system works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design
- The 9-phase approach ensures systematic extraction while maintaining functionality
- Tree-shaking effectiveness is validated throughout the implementation process