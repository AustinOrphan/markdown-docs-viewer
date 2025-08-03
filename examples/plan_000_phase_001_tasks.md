# Plan 000 - Phase 1: Core Performance Fixes (Tasks)

## Overview

This phase implements the fundamental performance optimizations that will provide immediate relief from the excessive HTTP request problem. These changes focus on smart config discovery and progressive document discovery with early termination.

## Timeline

**Duration**: Week 1 (5 days)  
**Priority**: High (Critical performance fixes)

## Objectives

- [ ] Reduce config file discovery from 4 requests to 1-2 requests
- [ ] Reduce document discovery from 60+ requests to 5-10 requests
- [ ] Implement caching for negative results
- [ ] Add early termination logic
- [ ] Maintain 100% backward compatibility

## Issue Implementation

### Issue #1: Smart Config File Discovery with Request Optimization

**Priority**: High | **Type**: Performance Bug | **Effort**: 2-3 days

#### Implementation Details

**Step 1: Create Cache System** (Day 1)

- [ ] Create `src/utils/discovery-cache.ts`
  - [ ] Define CacheEntry interface
    - [ ] Add data field (generic type T)
    - [ ] Add timestamp field
    - [ ] Add ttl field
  - [ ] Implement DiscoveryCache class
    - [ ] Create private cache Map
    - [ ] Implement set method
      - [ ] Accept key, data, and optional ttl
      - [ ] Store entry with timestamp
    - [ ] Implement get method
      - [ ] Check if entry exists
      - [ ] Validate TTL expiration
      - [ ] Return data or null
      - [ ] Clean up expired entries
    - [ ] Implement clear method
    - [ ] Add size limiting logic
    - [ ] Add memory usage tracking

**Step 2: Enhance ConfigLoader** (Day 1-2)

- [ ] Update `src/config-loader.ts`
  - [ ] Import required dependencies
    - [ ] DiscoveryCache
    - [ ] PerformanceMonitor
    - [ ] RequestMonitor
    - [ ] FeatureFlags
  - [ ] Add static configCache instance
  - [ ] Define CONFIG_FILES array (ordered by likelihood)
  - [ ] Enhance loadConfig method
    - [ ] Add performance monitoring start
    - [ ] Check for explicit configPath
    - [ ] Implement feature flag check
    - [ ] Add performance reporting
  - [ ] Implement smartAutoDiscoverConfig method
    - [ ] Check cached negative results
    - [ ] Implement file checking loop
      - [ ] Skip cached negatives
      - [ ] Record request metrics
      - [ ] Handle successful discovery
      - [ ] Cache negative results
      - [ ] Implement early termination
    - [ ] Log discovery results
  - [ ] Implement checkFileExists method
    - [ ] Add timeout handling
    - [ ] Use AbortController
    - [ ] Handle network errors
    - [ ] Return boolean result
  - [ ] Add validateConfig method
  - [ ] Add error handling

**Step 3: Add Tests** (Day 2-3)

- [ ] Create `tests/config-loader-performance.test.ts`
  - [ ] Set up test environment
    - [ ] Mock fetch API
    - [ ] Enable feature flags
    - [ ] Reset monitors
  - [ ] Test early termination
    - [ ] Verify stops after first found
    - [ ] Check request count
    - [ ] Validate loaded config
  - [ ] Test negative caching
    - [ ] Make multiple discoveries
    - [ ] Verify no duplicate requests
    - [ ] Check cache effectiveness
  - [ ] Test timeout handling
    - [ ] Simulate slow responses
    - [ ] Verify timeout behavior
    - [ ] Check fallback logic
  - [ ] Test error scenarios
    - [ ] Network failures
    - [ ] Invalid responses
    - [ ] Malformed config files
  - [ ] Test legacy compatibility
    - [ ] Disable feature flag
    - [ ] Verify old behavior works

---

### Issue #2: Progressive Document Discovery with Early Termination

**Priority**: High | **Type**: Performance Bug | **Effort**: 3-4 days

#### Implementation Details

**Step 1: Create Progressive Discovery Options** (Day 3)

- [ ] Update `src/types.ts`
  - [ ] Define ProgressiveDiscoveryOptions interface
    - [ ] Add maxDocuments field (default: 5)
    - [ ] Add maxRequests field (default: 10)
    - [ ] Add priorityFiles array (default: ['README.md', 'index.md'])
    - [ ] Add discoveryTimeout field (default: 30000ms)
    - [ ] Add earlyTermination flag (default: true)
  - [ ] Update AutoDiscoveryOptions interface
    - [ ] Add progressive field
    - [ ] Maintain backward compatibility
    - [ ] Document new options

**Step 2: Implement Progressive AutoDiscovery** (Day 3-4)

- [ ] Update `src/auto-discovery.ts`
  - [ ] Import required utilities
    - [ ] DiscoveryCache
    - [ ] PerformanceMonitor
    - [ ] RequestMonitor
    - [ ] FeatureFlags
  - [ ] Add static fileExistenceCache
  - [ ] Initialize instance variables
    - [ ] performanceMonitor
    - [ ] requestCount
    - [ ] discoveredDocuments array
  - [ ] Update constructor
    - [ ] Merge progressive options
    - [ ] Set default values
    - [ ] Validate configuration
  - [ ] Implement discoverFiles method
    - [ ] Check feature flag
    - [ ] Start performance monitoring
    - [ ] Set up timeout promise
    - [ ] Race discovery vs timeout
    - [ ] Handle errors gracefully
    - [ ] Return discovered documents
  - [ ] Implement performProgressiveDiscovery
    - [ ] Phase 1: Priority files
      - [ ] Check priority files first
      - [ ] Implement early termination check
      - [ ] Log discovery progress
    - [ ] Phase 2: Common files
      - [ ] Define common file list
      - [ ] Filter already checked files
      - [ ] Continue discovery
    - [ ] Phase 3: Subdirectories
      - [ ] Check if more docs needed
      - [ ] Test directory existence
      - [ ] Search in subdirectories
      - [ ] Respect request limits
    - [ ] Sort and return documents
  - [ ] Implement helper methods
    - [ ] shouldStopDiscovery
      - [ ] Check request limit
      - [ ] Check document limit
      - [ ] Check early termination flag
    - [ ] tryDiscoverFile
      - [ ] Check cache first
      - [ ] Make HEAD request
      - [ ] Handle response
      - [ ] Update cache
      - [ ] Process successful finds
    - [ ] checkDirectoryExists
      - [ ] Test with likely file
      - [ ] Handle errors gracefully
    - [ ] processFile method
    - [ ] sortDocuments method

**Step 3: Integration Tests** (Day 4-5)

- [ ] Create `tests/integration/progressive-discovery.test.ts`
  - [ ] Set up test environment
    - [ ] Mock file system
    - [ ] Enable feature flags
    - [ ] Prepare test documents
  - [ ] Test priority file discovery
    - [ ] Verify priority order
    - [ ] Check discovery count
    - [ ] Validate early termination
  - [ ] Test request limiting
    - [ ] Set low request limit
    - [ ] Verify stops at limit
    - [ ] Check partial results
  - [ ] Test caching behavior
    - [ ] Multiple discoveries
    - [ ] Verify cache hits
    - [ ] Check performance improvement
  - [ ] Test timeout handling
    - [ ] Simulate slow discovery
    - [ ] Verify timeout works
    - [ ] Check partial results returned
  - [ ] Test subdirectory discovery
    - [ ] Mock directory structure
    - [ ] Verify phased approach
    - [ ] Check efficiency
  - [ ] Test error scenarios
    - [ ] Network failures
    - [ ] Permission errors
    - [ ] Invalid file formats

## Rollout Strategy

### Week 1 Schedule

**Monday-Tuesday**: Issue #1 (Smart Config Discovery)

- [ ] Day 1: Implement caching system and enhanced ConfigLoader
- [ ] Day 2: Complete testing and integration

**Wednesday-Friday**: Issue #2 (Progressive Document Discovery)

- [ ] Day 3: Implement progressive discovery logic
- [ ] Day 4: Complete implementation and testing
- [ ] Day 5: Integration testing and performance validation

### Feature Flag Rollout

- [ ] **Internal Testing** (End of Week 1)
  - [ ] Enable features for development team
  - [ ] Monitor performance metrics
  - [ ] Validate backward compatibility

- [ ] **Beta Release** (Week 2)
  - [ ] Enable for 10% of users via feature flags
  - [ ] Monitor error rates and performance
  - [ ] Gather user feedback

- [ ] **General Availability** (Week 3)
  - [ ] Enable for all users
  - [ ] Keep feature flags for emergency rollback
  - [ ] Continue monitoring

## Testing Requirements

### Performance Benchmarks

- [ ] Create `tests/benchmarks/discovery-performance.bench.ts`
  - [ ] Implement legacy config discovery benchmark
  - [ ] Implement optimized config discovery benchmark
  - [ ] Implement legacy document discovery benchmark
  - [ ] Implement optimized document discovery benchmark
  - [ ] Add comparison reporting
  - [ ] Set up CI integration

### Success Metrics

- [ ] **Request Reduction**
  - [ ] Config discovery: 4 → 1-2 requests (75% reduction)
  - [ ] Document discovery: 60+ → 5-10 requests (85% reduction)

- [ ] **Performance Improvement**
  - [ ] Config discovery: <500ms (from 2-3s)
  - [ ] Document discovery: <1s (from 3-5s)

- [ ] **Cache Effectiveness**
  - [ ] 90% cache hit rate on subsequent loads
  - [ ] Negative result caching prevents repeated 404s

- [ ] **Backward Compatibility**
  - [ ] Zero breaking changes
  - [ ] Feature flags allow instant rollback
  - [ ] All existing configurations work

## Risks & Mitigations

### Risk: Cache Invalidation Issues

**Mitigation**: Conservative TTL values, clear cache on errors

- [ ] Implement cache clearing on errors
- [ ] Add cache size limits
- [ ] Monitor cache memory usage

### Risk: Early Termination Missing Important Files

**Mitigation**: Prioritize common files, configurable limits

- [ ] Make priority files configurable
- [ ] Allow users to override limits
- [ ] Log skipped discovery phases

### Risk: Performance Regression in Edge Cases

**Mitigation**: Comprehensive benchmarking, feature flag rollback

- [ ] Create edge case test suite
- [ ] Monitor performance metrics
- [ ] Implement automatic rollback triggers

## Next Steps

After completing Phase 1:

- [ ] 90% reduction in HTTP requests achieved
- [ ] Foundation laid for further optimizations
- [ ] Ready for Phase 2: Infrastructure improvements (Request pooling, enhanced error handling)
