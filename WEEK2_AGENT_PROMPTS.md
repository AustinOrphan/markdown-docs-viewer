# Week 2 Agent Prompts - Integration Phase

## Context for All Agents

Week 1 foundation components are complete. Week 2 focuses on **integration and algorithm implementation** to achieve the core optimization goals.

**Target**: Reduce 60+ HTTP requests to <10 requests during zero-config initialization.

## Agent A Prompt - Week 2

### Role: Smart Config Discovery & Request Management Specialist

You are now moving from foundation components to implementing the core optimization algorithms that will dramatically reduce HTTP requests.

### Your Week 2 Assignments

**Primary Focus**: Issues #61 (Smart Config Discovery), #63 (Request Pool Manager)

### Task 1: Smart Config Discovery Implementation

**File**: `src/optimization/algorithms/smart-config-discovery.ts`

**Goal**: Reduce 4 sequential config requests to 1-2 parallel requests

**Current Problem**: The system checks for config files sequentially:
1. `docs-config.json`
2. `documentation.json` 
3. `config.json`
4. `package.json`

**Your Solution**:
- Check common locations in **parallel** (not sequential)
- Use HEAD requests with fallback to GET (via environment adapters)
- Cache results using your DiscoveryCache
- Track performance with your PerformanceMonitor
- Monitor requests with your RequestMonitor

**Integration Points**:
- Use Agent B's environment adapters for HEAD→GET fallback
- Use Agent B's error handling for graceful failures
- Respect Agent C's feature flags (`SMART_CONFIG_DISCOVERY`)

### Task 2: Request Pool Manager & Circuit Breaker

**File**: `src/optimization/managers/request-pool-manager.ts`

**Goal**: Prevent request flooding and handle failures gracefully

**Features**:
- Request batching and pooling
- Circuit breaker for failed requests  
- Rate limiting to prevent overwhelming servers
- Integration with environment adapters

**Success Criteria**:
- Config discovery: 4 requests → 1-2 requests
- All requests properly monitored and cached
- Graceful fallback when optimization fails
- >95% test coverage

---

## Agent B Prompt - Week 2

### Role: Progressive Document Discovery Specialist

You are implementing the core algorithm that will reduce document discovery from 60+ requests to <10 requests.

### Your Week 2 Assignment

**Primary Focus**: Issue #62 (Progressive Document Discovery)

### Task 1: Progressive Document Discovery Algorithm

**File**: `src/optimization/algorithms/progressive-document-discovery.ts`

**Goal**: Reduce 60+ document requests to <10 with intelligent stopping

**Current Problem**: The system probes every possible document location without intelligence, making 60+ requests.

**Your Solution**:
1. **Smart Starting Points**: Begin with common patterns:
   - `README.md`, `index.md` in root
   - Common directory structures (`docs/`, `documentation/`)

2. **Progressive Expansion**: Based on found documents:
   - If `docs/README.md` exists, check `docs/` subdirectories
   - If pattern emerges, follow it intelligently
   - Stop when diminishing returns detected

3. **Early Stopping**: Implement intelligent stopping:
   - Stop after X consecutive 404s
   - Stop when pattern recognition is complete
   - Use statistical analysis to determine when to stop

**Integration Points**:
- Use Agent A's caching for discovered documents  
- Apply Agent A's request monitoring for optimization tracking
- Use your enhanced error handling for 404 detection
- Respect Agent C's feature flags (`PROGRESSIVE_DOCUMENT_DISCOVERY`)

### Task 2: Environment-Specific Optimizations

**File**: `src/optimization/adapters/enhanced-adapters.ts`

Enhance your environment adapters with document discovery optimizations:
- **GitHub Pages**: Use GitHub API when possible, fallback to file probing
- **Netlify/Vercel**: Leverage full HTTP capabilities for faster discovery

**Success Criteria**:
- Document discovery: 60+ requests → <10 requests  
- Intelligent stopping prevents unnecessary requests
- Environment-specific optimizations work correctly
- >95% test coverage

---

## Agent C Prompt - Week 2

### Role: Integration Testing & Manifest System Specialist

You are ensuring everything works together and implementing the ultimate optimization - zero requests via manifests.

### Your Week 2 Assignments

**Primary Focus**: Issues #66 (Manifest Discovery), #68 (Integration Testing)

### Task 1: Manifest-Based Discovery System

**File**: `src/optimization/algorithms/manifest-discovery.ts`

**Goal**: Zero HTTP requests when manifest exists

**Solution**:
1. **Manifest Detection**: Check for `.docs-manifest.json` or similar
2. **Manifest Structure**: Define format containing:
   - Available documents and their paths
   - Configuration information
   - Last updated timestamp
3. **Fallback Behavior**: When manifest missing/stale, use other algorithms
4. **Generation Tools**: Utilities to auto-generate manifests

**Integration Points**:
- Use Agent A's caching for manifest storage
- Fallback to Agent B's progressive discovery when needed
- Respect feature flags (`MANIFEST_DISCOVERY`)

### Task 2: Integration Testing Suite

**File**: `tests/optimization/integration-suite.ts`

**Goal**: Validate all algorithms work together and meet performance targets

**Test Coverage**:
1. **End-to-End Testing**: Full optimization pipeline
2. **Performance Benchmarking**: Must achieve <10 requests
3. **Cross-Environment Testing**: GitHub Pages, Netlify, Vercel
4. **Feature Flag Combinations**: All permutations work correctly
5. **Regression Testing**: No breaking changes to existing behavior

**Success Criteria**:
- Zero HTTP requests when manifest available
- Integration tests pass for all algorithm combinations
- Performance benchmarks meet <10 request target
- >95% test coverage for integration scenarios

## Week 2 Coordination

### Daily Standups (via PROGRESS_TRACKER.md)
- Update your section daily with progress
- Note any integration blockers
- Coordinate testing scenarios

### Integration Points Testing
- **Wednesday**: All agents test cross-component integration
- **Thursday**: End-to-end testing across environments
- **Friday**: Performance optimization and bug fixes

### Success Metrics
- **Agent A**: Config requests reduced by 50%+
- **Agent B**: Document requests reduced by 85%+  
- **Agent C**: Zero requests when manifest available
- **Combined**: <10 total requests for full initialization