# Virtual Research Group System Implementation Plan

## Overview

Build a collaborative research training environment with knowledge graph visualization, simulating real research processes through nodes (Problem, Experiment, Literature, Data, Conclusion) and relationships.

## Technology Choices

### Canvas Library: **React Flow**

- Native node/edge system, zoom/pan, selection
- 80% faster development vs custom implementation
- Proven in research tools (Obsidian, Notion)
- Real-time ready with simple state sync

### Real-time Collaboration: **Yjs + y-websocket**

- CRDT for automatic conflict resolution
- Used by Notion, Jupyter
- Offline support

## Phase 1: Core Canvas (4-6 weeks)

### Week 1-2: Foundation

**Dependencies to install:**

```bash
pnpm add reactflow yjs y-websocket
```

**Database schema:**

- Create `/server/src/migrations/001_create_research_tables.sql`
- Tables: `research_projects`, `research_project_members`, `research_canvases`, `research_nodes`, `research_edges`, `research_node_comments`, `research_activity_log`

**Backend endpoints:**

- Create `/server/src/routes/research.routes.ts`
- Create `/server/src/controllers/research.controller.ts`
- Create `/server/src/models/research.model.ts`
- Implement CRUD for projects, canvases, nodes, edges

**TypeScript types:**

- Create `/src/types/research.ts` - All node/edge/project interfaces

### Week 3-4: Canvas UI

**Main components:**

- `/src/feature/research/components/canvas/ResearchCanvas.tsx` - Main React Flow container
- `/src/feature/research/stores/canvasStore.ts` - Zustand store for canvas state
- 5 node components: `ProblemNode.tsx`, `ExperimentNode.tsx`, `LiteratureNode.tsx`, `DataNode.tsx`, `ConclusionNode.tsx`
- `/src/feature/research/components/edges/CustomEdge.tsx` - Custom edge with labels
- `/src/feature/research/components/panels/NodeDetailsPanel.tsx` - Property editor

**Features:**

- Infinite canvas with zoom/pan (React Flow built-in)
- Node selection and drag-drop
- Edge creation via node handles
- Mini-map overview
- Node creation toolbar

### Week 5-6: Core Features

- Delete functionality (nodes & edges)
- Basic validation (no circular dependencies)
- `/src/feature/research/components/project/ProjectList.tsx` - Project gallery
- `/src/feature/research/components/project/ProjectCard.tsx` - Project preview
- Canvas save/load from database
- Activity logging

**Update routing in `/src/App.tsx`:**

```typescript
<Route path="/lab/projects" element={<ResearchProjectList />} />
<Route path="/lab/projects/:projectId" element={<ResearchProjectPage />} />
<Route path="/lab/projects/:projectId/canvases/:canvasId" element={<ResearchCanvas />} />
```

**Files to modify:**

- `src/App.tsx` - Add research routes
- `src/pages/LabPage.tsx` - Enhance with project creation CTA
- `src/i18n/locales/zh-cn.json` - Add translations

### Deliverables Phase 1

- Single-user research canvas
- Create/edit/delete nodes and edges
- 5 node types with specific properties
- Node property editor
- Project management (create/list projects)

## Phase 2: Simulation Integration (2-3 weeks)

### Week 7-8: Demo Integration

**Create demo registry:**

- Map existing demos (`ColorStateDemo`, `BrewsterAngleDemo`) to node templates
- `/src/feature/research/hooks/useExperimentCreation.ts` - Create Experiment nodes from demos

**Simulation runner:**

- `/src/services/simulation.service.ts` - Run simulations from canvas
- Client-side runner for ColorStateDemo using existing `/src/lib/physics/Saccharimetry.ts`
- Add "Run Simulation" button to Experiment nodes
- Parameter UI for simulation configuration

### Week 9: Result Management

- Attach simulation results to nodes
- Result preview in node cards
- Create Data nodes from results
- Export functionality (CSV, JSON, MATLAB)

### Deliverables Phase 2

- Create experiment nodes from demos
- Run simulations from canvas
- Attach results to nodes
- Create data nodes from results
- Export simulation data

## Phase 3: Real-time Collaboration (3-4 weeks)

### Week 10-11: Yjs Integration

**WebSocket server:**

- `/server/src/websocket/canvasHandler.ts` - Yjs WebSocket handler
- Canvas session management
- Document persistence (debounced)

**Client sync:**

- `/src/feature/research/hooks/useCanvasSync.ts` - Yjs sync hook
- Connection status indicators
- Offline/online transitions

### Week 12-13: Multi-user Features

- User presence indicators (who's viewing)
- Cursor tracking (show other users' cursors)
- User avatars on nodes
- Real-time comments on nodes
- `/src/feature/research/components/panels/CommentsPanel.tsx`

### Week 14: Polish & Testing

- Stress testing with multiple users
- Conflict resolution UI
- Performance optimization
- Activity feed

### Deliverables Phase 3

- Real-time multi-user editing
- User presence and cursors
- Conflict-free collaboration
- Real-time comments
- Activity feed

## Phase 4: Task Board & Advanced Features (2-3 weeks)

### Week 15-16: Task Board

**Kanban components:**

- `/src/feature/research/components/taskboard/TaskBoard.tsx` - Kanban layout
- `/src/feature/research/components/taskboard/TaskColumn.tsx` - Status column
- `/src/feature/research/components/taskboard/TaskCard.tsx` - Task card
- Drag-and-drop between columns
- Task assignment UI

### Week 17: Advanced Features

- Mini-map with node type filtering
- Search functionality
- Canvas templates
- Import/export (JSON, markdown)
- Canvas history/time travel

### Deliverables Phase 4

- Kanban-style task board
- Task assignment and tracking
- Search and filter
- Canvas templates
- Import/export functionality

## Phase 5: Polish & Launch (1-2 weeks)

### Week 18-19: Final Polish

- Comprehensive testing
- Performance optimization
- Accessibility audit
- Security review
- Documentation
- User guide
- Deploy to production

### Deliverables Phase 5

- Production-ready system
- Complete documentation
- User guide
- Live deployment

## Critical Files Summary

### Frontend (Create)

1. `/src/types/research.ts` - Complete type definitions
2. `/src/feature/research/stores/canvasStore.ts` - Zustand store
3. `/src/feature/research/components/canvas/ResearchCanvas.tsx` - Main canvas
4. `/src/feature/research/components/nodes/ExperimentNode.tsx` - Template for other nodes
5. `/src/feature/research/hooks/useCanvasSync.ts` - Real-time sync
6. `/src/services/research.service.ts` - API client

### Backend (Create)

1. `/server/src/migrations/001_create_research_tables.sql` - Database schema
2. `/server/src/routes/research.routes.ts` - API routes
3. `/server/src/controllers/research.controller.ts` - Business logic
4. `/server/src/models/research.model.ts` - Data access
5. `/server/src/websocket/canvasHandler.ts` - WebSocket handler

### Modify

1. `src/App.tsx` - Add routes
2. `src/pages/LabPage.tsx` - Enhance placeholder
3. `src/i18n/locales/zh-cn.json` - Add translations
4. `package.json` - Add dependencies

## Verification

### Manual Testing

- Create a project with 5+ nodes
- Link nodes with different edge types
- Run a simulation and attach results
- Open canvas in 2 browsers, verify sync
- Create tasks and move them in Kanban

### API Testing

- Use `/api/research/projects` endpoints
- Verify node/edge CRUD operations
- Test WebSocket connection

### End-to-End

- User creates project → adds problem node → creates experiment → runs simulation → attaches results → creates conclusion → exports to gallery

## Estimated Timeline

- **Phase 1**: 4-6 weeks (Core canvas)
- **Phase 1**: 4-6 weeks (Core canvas)
- **Phase 2**: 2-3 weeks (Simulation)
- **Phase 3**: 3-4 weeks (Collaboration)
- **Phase 4**: 2-3 weeks (Task board)
- **Phase 5**: 1-2 weeks (Polish)
- **Total**: 12-18 weeks
