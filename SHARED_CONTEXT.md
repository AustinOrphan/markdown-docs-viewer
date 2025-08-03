# SHARED_CONTEXT.md - Zero-Config Optimization Project

This document serves as the central reference for all Claude Code agents working on the zero-config optimization project. All agents should review this document before starting work and reference it for integration points.

## Project Overview

**Problem**: Zero-config auto-discovery makes 60+ HTTP requests during initialization

- ConfigLoader: 4 sequential requests for config files
- AutoDiscovery: 60+ requests (10 common files × 6 directory paths)

**Goal**: Reduce HTTP requests to <10 while maintaining backward compatibility

**GitHub Issues**: #60-#68 (see individual issues for details)

## Agent Assignments

### Agent A - Performance/Infrastructure Track

- **Issues**: #60 → #63 → #61 → #62 → #66
- **Focus**: Request optimization, caching, performance monitoring
- **Primary Files**:
  - `src/config-loader.ts`
  - `src/auto-discovery.ts`
  - New: `src/optimization/foundation/*`
  - New: `src/optimization/request-manager/*`

### Agent B - Platform/UX Track

- **Issues**: #60 → #65 → #64 → Integration
- **Focus**: Cross-platform compatibility, error handling, user experience
- **Primary Files**:
  - New: `src/optimization/environment/*`
  - New: `src/optimization/errors/*`
  - Integration with existing error handling

### Agent C - Configuration/Testing Track

- **Issues**: #60 → #67 → Testing/Polish → Integration
- **Focus**: User configuration, feature flags, testing infrastructure
- **Primary Files**:
  - New: `src/optimization/config/*`
  - `tests/` (various test files)
  - New: `src/optimization/foundation/FeatureFlags.ts`

## Agreed Interfaces

These interfaces are contracts between agents. DO NOT modify without coordination.

```typescript
// ===== FOUNDATION INTERFACES (Week 1) =====

// Agent A implements
export interface PerformanceMonitor {
  startMeasure(label: string): PerformanceMeasurement;
  endMeasure(label: string): PerformanceReport;
  getReport(): PerformanceReport[];
  reset(): void;
}

export interface PerformanceMeasurement {
  label: string;
  startTime: number;
  end(): PerformanceReport;
}

export interface PerformanceReport {
  label: string;
  duration: number;
  startTime: number;
  endTime: number;
}

// Agent A implements
export interface DiscoveryCache<T = any> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
}

// Agent C implements
export interface FeatureFlags {
  isEnabled(flag: string): boolean;
  enable(flag: string): void;
  disable(flag: string): void;
  getAll(): Record<string, boolean>;
  reset(): void;
}

// ===== WEEK 2 INTERFACES =====

// Agent A implements
export interface RequestManager {
  fetch(url: string, options?: RequestInit): Promise<RequestResult>;
  getStats(): RequestStats;
  reset(): void;
  getInstance(): RequestManager; // Singleton
}

export interface RequestResult {
  success: boolean;
  data?: Response;
  error?: Error;
  duration: number;
  attempts: number;
  fromCache?: boolean;
}

export interface RequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  averageResponseTime: number;
  circuitBreakerTrips: number;
}

// Agent B implements
export interface EnvironmentDetector {
  detect(): Promise<EnvironmentInfo>;
  getCachedEnvironment(): EnvironmentInfo | null;
  getInstance(): EnvironmentDetector; // Singleton
}

export interface EnvironmentInfo {
  type: HostingEnvironment;
  confidence: number;
  indicators: string[];
  capabilities: EnvironmentCapabilities;
}

export enum HostingEnvironment {
  GITHUB_PAGES = 'github_pages',
  NETLIFY = 'netlify',
  VERCEL = 'vercel',
  LOCAL_DEV = 'local_dev',
  UNKNOWN = 'unknown',
}

export interface EnvironmentCapabilities {
  corsSupport: boolean;
  headRequests: boolean;
  maxConcurrentRequests: number;
  // ... other capabilities
}

// ===== WEEK 3 INTERFACES =====

// Agent B implements
export interface DiscoveryError extends Error {
  type: ErrorType;
  context: string;
  userMessage: string;
  suggestions: string[];
  technicalDetails?: any;
}

// Agent C implements
export interface DiscoveryConfig {
  maxDiscoveryRequests?: number;
  maxDocuments?: number;
  discoveryStrategy?: 'aggressive' | 'conservative' | 'manifest-only';
  cacheEnabled?: boolean;
  debugMode?: boolean;
  // ... other config options
}
```

## File Structure

```
src/
  optimization/              # All new optimization code
    foundation/             # Week 1 - All agents
      PerformanceMonitor.ts # Agent A
      DiscoveryCache.ts     # Agent A
      FeatureFlags.ts       # Agent C
      RequestMonitor.ts     # Agent A
      index.ts             # Exports

    request-manager/        # Week 2 - Agent A
      RequestManager.ts
      CircuitBreaker.ts
      RequestPool.ts
      index.ts

    environment/           # Week 2 - Agent B
      EnvironmentDetector.ts
      RequestStrategy.ts
      strategies/
        GitHubPagesStrategy.ts
        NetlifyStrategy.ts
        index.ts
      index.ts

    errors/               # Week 3 - Agent B
      DiscoveryError.ts
      ErrorAnalyzer.ts
      ErrorDisplay.ts
      index.ts

    config/               # Week 3 - Agent C
      DiscoveryConfig.ts
      ConfigManager.ts
      ConfigPanel.ts
      index.ts

    manifest/             # Week 4 - Agent A
      ManifestLoader.ts
      types.ts
      index.ts

tests/
  optimization/           # Mirror structure for tests
    foundation/
    request-manager/
    environment/
    errors/
    config/
    manifest/
```

## Integration Points & Schedule

### Week 1 (Days 1-4): Foundation - ALL AGENTS

**Deliverables by end of Day 4**:

- Agent A: PerformanceMonitor, DiscoveryCache, RequestMonitor
- Agent B: Base error classes, environment detection utilities
- Agent C: FeatureFlags, test framework setup

**Integration checkpoint**: Day 4 evening - All foundation utilities must be committed

### Week 2 (Days 5-9): Infrastructure

**Agent A**: RequestManager with pooling and circuit breaker
**Agent B**: EnvironmentDetector and platform strategies
**Agent C**: Continue from Week 1, begin planning config system

**Integration checkpoint**: Day 9 - RequestManager and EnvironmentDetector APIs stable

### Week 3 (Days 10-14): Core Features

**Agent A**: Smart Config Discovery (#61) → Progressive Document Discovery (#62)
**Agent B**: Enhanced Error Handling (#64)
**Agent C**: User Configuration (#67)

**Integration checkpoint**: Day 14 - All core features integrated

### Week 4 (Days 15-19): Advanced Features

**Agent A**: Complete #62 → Manifest System (#66)
**Agent B & C**: Polish, integration, testing

### Week 5 (Days 20-24): Validation

**All Agents**: Performance Testing Suite (#68)

## Git Workflow

1. **Base branch**: `feature/zero-config-optimization`
2. **Feature branches**: `feature/[issue-number]-[short-description]`
3. **Commit format**: `[type](#[issue]): [description]`
   - Example: `feat(#60): Add PerformanceMonitor class`
4. **Pull frequency**: At least twice daily to get other agents' changes
5. **Merge strategy**: Rebase feature branches, merge to base

## Communication Protocol

### Use GitHub Issue Comments

- Post when starting work on a component
- Document any interface changes
- Flag integration dependencies

### Use TODO Comments

```typescript
// TODO(Agent B): Replace with EnvironmentDetector.detect() when available
const environment = 'unknown'; // temporary

// TODO(Agent A): Use RequestManager here once implemented
const response = await fetch(url); // temporary
```

### Progress Updates

Update `/PROGRESS_TRACKER.md` daily with:

- Completed components
- Current work
- Blockers
- Integration readiness

## Testing Strategy

### Unit Tests

Each component should have corresponding test file:

- `src/optimization/foundation/PerformanceMonitor.ts`
- `tests/optimization/foundation/PerformanceMonitor.test.ts`

### Mock Utilities

Create mocks that other agents can use:

```typescript
// tests/utils/mocks/mockRequestManager.ts
export function createMockRequestManager(): RequestManager {
  return {
    fetch: vi.fn().mockResolvedValue({ success: true, ... }),
    getStats: vi.fn().mockReturnValue({ ... }),
    reset: vi.fn(),
    getInstance: vi.fn()
  };
}
```

### Integration Tests

Week 3+: Create integration tests that verify agent components work together

## Important Notes

1. **No Breaking Changes**: All optimizations must maintain backward compatibility
2. **Feature Flags**: All new behavior should be behind feature flags initially
3. **Performance First**: Every change should be measured for performance impact
4. **Error Handling**: All components must handle errors gracefully
5. **Documentation**: Update inline documentation as you code

## Questions or Changes?

If you need to:

- Modify an interface: Create GitHub issue comment and wait for other agents
- Add new integration point: Update this document and notify via issue
- Report blocker: Update PROGRESS_TRACKER.md and comment on relevant issue

---

Last updated: 2025-08-03
Next review: Day 5 (Week 2 start)
