# PolarCraft Technical Debt Reduction Plan

## Context

This plan addresses the technical debt found in the PolarCraft project, a voxel puzzle game based on polarized light physics built with React 19, TypeScript, Three.js, and Express + MySQL. The codebase consists of approximately 70,000+ lines of code across 180+ TypeScript files.

The technical debt analysis revealed several categories of issues:
- Deprecated code still present (1,493 lines)
- Large monolithic files (>1000 lines)
- Incomplete backend integration
- Type safety issues (`as any` casts)
- TODO comments blocking features (13 total)
- Duplicate code patterns
- Missing error handling
- Debug code left in production

## Recommended Approach

This plan prioritizes technical debt reduction by impact and risk, addressing critical issues first while maintaining system stability.

### Phase 1: Critical Debt Removal (Immediate Actions)

#### 1.1 Remove Deprecated WaveOptics Module
**Files:** [src/lib/physics/WaveOptics.ts](src/lib/physics/WaveOptics.ts)
- **Impact:** Remove 1,493 lines of dead code marked as `@deprecated`
- **Action:**
  1. Search for all imports of `WaveOptics` using Grep
  2. Replace imports with `src/lib/physics/unified/` equivalents
  3. Remove the file after confirming no active imports
- **Risk:** Low - code already marked deprecated
- **Verification:** Run tests, check for import errors

#### 1.2 Complete Email Service for Password Reset
**Files:** [server/src/services/auth.service.ts](server/src/services/auth.service.ts:185-186)
- **Impact:** Unblock critical auth functionality
- **Action:**
  1. Implement email sending using Nodemailer or SendGrid
  2. Add email templates for password reset
  3. Configure SMTP/SendGrid in environment variables
- **Risk:** Medium - requires external service configuration
- **Verification:** Test password reset flow end-to-end

#### 1.3 Connect Research Node CRUD to Backend
**Files:** [src/feature/research/components/panels/NodeDetailsPanel.tsx](src/feature/research/components/panels/NodeDetailsPanel.tsx:86-99)
- **Impact:** Complete research module functionality
- **Action:**
  1. Implement API calls in existing `handleSave` and `handleDelete` functions
  2. Add loading states and error handling
  3. Connect to backend endpoints in [server/src/controllers/research.controller.ts](server/src/controllers/research.controller.ts:434-465)
- **Risk:** Medium
- **Verification:** Create/update/delete nodes in research canvas and verify persistence

### Phase 2: High-Priority Refactoring

#### 2.1 Split Large Icon Components
**Files:**
- [src/components/icons/ModuleIcons.tsx](src/components/icons/ModuleIcons.tsx) (2,480 lines)
- [src/components/icons/HomeModuleIcons.tsx](src/components/icons/HomeModuleIcons.tsx) (1,317 lines)

- **Impact:** Improve maintainability, enable better tree-shaking
- **Action:**
  1. Extract each icon to its own file: `src/components/icons/modules/CourseIcon.tsx`, etc.
  2. Create barrel exports: `src/components/icons/modules/index.ts`
  3. Consolidate duplicate icons between the two files
- **Risk:** Low
- **Verification:** All icons render correctly, no broken imports

#### 2.2 Refactor Blocks.tsx with Strategy Pattern
**File:** [src/feature/games/Minecraft/Blocks.tsx](src/feature/games/Minecraft/Blocks.tsx:99-150)
- **Impact:** Reduce complexity from 1,478-line switch statement
- **Action:**
  1. Create block renderer classes: `SolidBlockRenderer`, `EmitterBlockRenderer`, etc.
  2. Use a registry pattern: `blockRenderers[type]`
  3. Move block-specific logic to individual modules
- **Risk:** Medium - core game logic
- **Verification:** All block types render correctly in game

#### 2.3 Extract Components from ExperimentResourcesTab
**File:** [src/feature/course/chronicles/ExperimentResourcesTab.tsx](src/feature/course/chronicles/ExperimentResourcesTab.tsx) (1,204 lines)
- **Impact:** Improve component testability and reusability
- **Action:**
  1. Extract `CategoryFilter` component
  2. Extract `MediaGrid` component
  3. Extract `ResourceCard` component
- **Risk:** Low
- **Verification:** UI functionality unchanged, components render correctly

#### 2.4 Resolve Type Safety Issues
**Files:** 14 files with `as any` casts, primarily in:
- [src/feature/research/components/panels/NodeDetailsPanel.tsx](src/feature/research/components/panels/NodeDetailsPanel.tsx)
- [src/feature/research/utils/canvasDataConverter.ts](src/feature/research/utils/canvasDataConverter.ts)

- **Impact:** Improve type safety, catch bugs at compile time
- **Action:**
  1. Define proper interfaces for all `any` types
  2. Use type guards for runtime type checking
  3. Enable stricter TypeScript rules incrementally
- **Risk:** Low
- **Verification:** TypeScript compilation succeeds, no type errors

### Phase 3: Data Externalization

#### 3.1 Move Large Static Data to JSON
**Files:**
- [src/data/timeline-events.ts](src/data/timeline-events.ts) (3,634 lines)
- [src/data/researchExampleProjects.ts](src/data/researchExampleProjects.ts) (1,770 lines)
- [src/data/psrt-curriculum.ts](src/data/psrt-curriculum.ts) (1,312 lines)
- [src/data/resource-gallery.ts](src/data/resource-gallery.ts) (1,021 lines)

- **Impact:** Reduce bundle size, enable dynamic loading, easier content updates
- **Action:**
  1. Convert TypeScript data files to JSON
  2. Move to `/public/data/` directory
  3. Create TypeScript types for the data
  4. Fetch data dynamically or import at build time
- **Risk:** Medium - data structure changes
- **Verification:** All data loads correctly, UI renders properly

### Phase 4: Code Quality Improvements

#### 4.1 Remove TODO Comments
**Files:** 13 TODO comments across frontend and backend
- **Impact:** Complete incomplete features, reduce technical debt markers
- **Action:**
  1. Implement or remove each TODO
  2. For features not yet needed, document in issue tracker instead of code
- **Priority TODOs:**
   - Image viewer in gallery (2 occurrences)
   - Video playback in media gallery
   - Reflection calculation in Birefringence3D
   - Research module backend integration
- **Risk:** Varies by feature
- **Verification:** All TODOs resolved or properly tracked

#### 4.2 Clean Up Console.log Statements
**Files:** 17 files with debug console statements
- **Impact:** Remove debug code from production, improve performance
- **Action:**
  1. Replace `console.log` with proper logger from [src/lib/logger.ts](src/lib/logger.ts)
  2. Use appropriate log levels (debug, info, warn, error)
  3. Remove unnecessary debug statements
- **Risk:** Low
- **Verification:** Application works without console spam

#### 4.3 Standardize Error Handling
**Files:** Multiple API calls and async functions
- **Impact:** Improve user experience, enable better debugging
- **Action:**
  1. Create error handling utilities in [src/lib/api.ts](src/lib/api.ts)
  2. Implement error classification (network, auth, validation, server)
  3. Add user-friendly error messages
  4. Implement retry logic for transient failures
- **Risk:** Low
- **Verification:** Errors display properly to users, logs capture details

### Phase 5: Configuration and Documentation

#### 5.1 Consolidate TypeScript Configuration
**Files:**
- [tsconfig.json](tsconfig.json)
- [tsconfig.node.json](tsconfig.node.json)
- [server/tsconfig.json](server/tsconfig.json)

- **Impact:** Simplify build configuration
- **Action:**
  1. Review and merge where appropriate
  2. Use `extends` for shared configuration
  3. Document TypeScript project references
- **Risk:** Low
- **Verification:** Build succeeds in all environments

#### 5.2 Add Environment Variable Documentation
**Files:** Create new `.env.example` file
- **Impact:** Improve developer onboarding
- **Action:**
  1. Document all required environment variables
  2. Add descriptions and default values
  3. Include in [README.md](README.md)
- **Risk:** None
- **Verification:** New developers can set up environment from example

#### 5.3 Standardize Comment Language
**Files:** Mixed English/Chinese comments throughout
- **Impact:** Improve code consistency
- **Action:**
  1. Choose primary language for code comments (recommend English)
  2. Document decision in [README.md](README.md) or CLAUDE.md
  3. Gradually standardize comments during other work
- **Risk:** None
- **Verification:** N/A - this is an ongoing process

## Implementation Order

1. **Week 1:** Phase 1 (Critical Debt Removal)
   - Remove deprecated WaveOptics.ts
   - Complete email service

2. **Week 2:** Phase 2 (High-Priority Refactoring) - Part 1
   - Split icon components
   - Fix type safety issues

3. **Week 3:** Phase 2 (High-Priority Refactoring) - Part 2
   - Refactor Blocks.tsx
   - Extract components from ExperimentResourcesTab

4. **Week 4:** Phase 3 (Data Externalization)
   - Move static data to JSON files

5. **Week 5:** Phase 4 (Code Quality)
   - Resolve TODOs
   - Clean up console statements
   - Standardize error handling

6. **Week 6:** Phase 5 (Configuration)
   - Consolidate configs
   - Add documentation

## Critical Files to Modify

### Frontend
- [src/lib/physics/WaveOptics.ts](src/lib/physics/WaveOptics.ts) - DELETE (deprecated)
- [src/components/icons/ModuleIcons.tsx](src/components/icons/ModuleIcons.tsx) - REFACTOR (split)
- [src/components/icons/HomeModuleIcons.tsx](src/components/icons/HomeModuleIcons.tsx) - REFACTOR (consolidate)
- [src/feature/games/Minecraft/Blocks.tsx](src/feature/games/Minecraft/Blocks.tsx) - REFACTOR (strategy pattern)
- [src/feature/research/components/panels/NodeDetailsPanel.tsx](src/feature/research/components/panels/NodeDetailsPanel.tsx) - COMPLETE (backend integration)
- [src/lib/api.ts](src/lib/api.ts) - ENHANCE (error handling)

### Backend
- [server/src/services/auth.service.ts](server/src/services/auth.service.ts) - COMPLETE (email service)
- [server/src/controllers/research.controller.ts](server/src/controllers/research.controller.ts) - COMPLETE (TODOs)

### Data Files
- [src/data/timeline-events.ts](src/data/timeline-events.ts) - MOVE to JSON
- [src/data/researchExampleProjects.ts](src/data/researchExampleProjects.ts) - MOVE to JSON
- [src/data/psrt-curriculum.ts](src/data/psrt-curriculum.ts) - MOVE to JSON

## Verification Strategy

### Automated Testing
```bash
# Run frontend tests
npm run test

# Run frontend tests with coverage
npm run test:coverage

# Build verification
npm run build

# Type checking
npx tsc --noEmit
```

### Manual Testing Checklist
- [ ] All pages load without errors
- [ ] Auth flow works (login, register, password reset)
- [ ] Research canvas CRUD operations persist
- [ ] Game renders all block types correctly
- [ ] All icons display properly
- [ ] Timeline and course data load correctly

### Performance Monitoring
- [ ] Measure bundle size before/after data externalization
- [ ] Check build times after config consolidation
- [ ] Monitor runtime performance after large file refactoring

## Summary

This plan addresses approximately **10,000+ lines** of technical debt across:

| Category | Files | Lines Affected | Priority |
|----------|-------|----------------|----------|
| Deprecated Code | 1 | 1,493 | Critical |
| Large Files | 6 | ~8,000 | High |
| Type Safety | 14 | ~500 | High |
| TODOs | 13 | ~50 | High |
| Data Files | 4 | ~7,700 | Medium |
| Console Cleanup | 17 | ~100 | Medium |
| Configuration | 5 | ~200 | Low |

**Expected outcomes:**
- Reduced bundle size through data externalization
- Improved maintainability through smaller, focused files
- Better type safety leading to fewer runtime errors
- Completed features (auth, research module)
- Cleaner, more professional codebase
