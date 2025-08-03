# Agent Prompts Summary

This document summarizes the prompts created for the 3 Claude Code agents working on the Zero-Config Optimization project.

## How to Use These Prompts

1. Open 3 separate Claude Code sessions
2. Copy each agent's prompt into their respective session
3. Each agent should start by:
   - Reading their prompt file
   - Reviewing SHARED_CONTEXT.md
   - Checking WEEK1_WORK_DIVISION.md
   - Beginning their first task

## Agent A - Performance and Caching Specialist

**File**: `AGENT_A_PROMPT.md`

**Focus Areas**:
- PerformanceMonitor implementation
- DiscoveryCache with LRU eviction
- RequestMonitor for HTTP tracking

**Key Deliverables**:
- `src/optimization/utils/performance-monitor.ts`
- `src/optimization/cache/discovery-cache.ts`
- `src/optimization/monitors/request-monitor.ts`

## Agent B - Error Handling and Environment Specialist

**File**: `AGENT_B_PROMPT.md`

**Focus Areas**:
- Base error classes and error factory
- Environment detection (GitHub Pages, Netlify, Vercel)
- Environment-specific request adapters

**Key Deliverables**:
- `src/optimization/errors/base-errors.ts`
- `src/optimization/errors/error-factory.ts`
- `src/optimization/utils/environment-detector.ts`
- `src/optimization/adapters/github-pages-adapter.ts`

## Agent C - Feature Flags and Testing Infrastructure

**File**: `AGENT_C_PROMPT.md`

**Focus Areas**:
- Feature flag system with localStorage
- Cross-environment testing framework
- Environment mocking utilities

**Key Deliverables**:
- `src/optimization/utils/feature-flags.ts`
- `tests/optimization/test-helpers.ts`
- `tests/utils/environment-mock.ts`

## Coordination Points

1. **Daily Updates**: Each agent updates their section in PROGRESS_TRACKER.md
2. **Integration Points**: Follow the interfaces defined in SHARED_CONTEXT.md
3. **Git Workflow**: All work on `feature/zero-config-optimization` branch
4. **Communication**: Use PR comments for cross-agent coordination

## Week 1 Timeline

- **Monday-Tuesday**: Core component implementation
- **Wednesday**: Initial integration and testing
- **Thursday**: Cross-component testing
- **Friday**: Documentation and handoff preparation

## Success Metrics

- All interfaces implemented according to specifications
- >95% test coverage for all components
- Zero conflicts between agent implementations
- Ready for Week 2 integration phase