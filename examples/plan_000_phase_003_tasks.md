# Plan 000 - Phase 3: Cross-Environment Compatibility (Tasks)

## Overview

This phase addresses the critical need for the zero-config system to work reliably across different hosting environments. It implements environment detection, platform-specific adaptations, and ensures compatibility with GitHub Pages, Netlify, Vercel, and other common hosting solutions.

## Timeline

**Duration**: Week 3 (5 days)  
**Priority**: High (Critical for real-world usage)

## Objectives

- [ ] Auto-detect hosting environment and adapt behavior accordingly
- [ ] Handle CORS restrictions on GitHub Pages
- [ ] Support redirect-based routing on Netlify/Vercel
- [ ] Implement environment-specific request strategies
- [ ] Provide fallback mechanisms for restrictive environments

## Issue Implementation

### Issue #5: Hosting Environment Compatibility

**Priority**: High | **Type**: Compatibility | **Effort**: 4-5 days

#### Implementation Details

**Step 1: Environment Detection System** (Day 1)

- [ ] Create `src/environment/detector.ts`
  - [ ] Define HostingEnvironment enum
    - [ ] GITHUB_PAGES
    - [ ] NETLIFY
    - [ ] VERCEL
    - [ ] GITLAB_PAGES
    - [ ] SURGE
    - [ ] FIREBASE
    - [ ] AWS_S3
    - [ ] STATIC_SERVER
    - [ ] LOCAL_DEV
    - [ ] UNKNOWN
  - [ ] Define EnvironmentInfo interface
    - [ ] Add type field (HostingEnvironment)
    - [ ] Add confidence field (0-1)
    - [ ] Add indicators array
    - [ ] Add capabilities field
  - [ ] Define EnvironmentCapabilities interface
    - [ ] Add corsSupport boolean
    - [ ] Add headRequests boolean
    - [ ] Add redirectSupport boolean
    - [ ] Add customHeaders boolean
    - [ ] Add http2Support boolean
    - [ ] Add compressionSupport boolean
    - [ ] Add maxConcurrentRequests number
    - [ ] Add hasServiceWorker boolean
    - [ ] Add hasSPA404Handling boolean
  - [ ] Implement EnvironmentDetector class
    - [ ] Create singleton pattern
      - [ ] Private constructor
      - [ ] Static instance field
      - [ ] getInstance method
    - [ ] Add cachedInfo field
    - [ ] Implement detect method
      - [ ] Check cache first
      - [ ] Initialize detection variables
      - [ ] Get URL components
      - [ ] Perform URL-based detection
      - [ ] Perform behavior-based detection
      - [ ] Get capabilities
      - [ ] Cache and return results
    - [ ] Implement URL detection methods
      - [ ] isGitHubPages method
        - [ ] Check .github.io domain
        - [ ] Check github subdomain
        - [ ] Check custom domain indicators
      - [ ] isNetlify method
        - [ ] Check .netlify.app domain
        - [ ] Check .netlify.com domain
        - [ ] Check netlify substring
      - [ ] isVercel method
        - [ ] Check .vercel.app domain
        - [ ] Check .now.sh domain
        - [ ] Check vercel substring
      - [ ] isLocalDev method
        - [ ] Check localhost
        - [ ] Check 127.0.0.1
        - [ ] Check local IP ranges
        - [ ] Check .local domain
    - [ ] Implement structure detection
      - [ ] hasGitHubPagesStructure method
        - [ ] Check for 404.html
        - [ ] Check Jekyll meta tag
        - [ ] Return boolean result
    - [ ] Implement behavior detection
      - [ ] detectByBehavior method
        - [ ] Test CORS capability
        - [ ] Test redirect behavior
        - [ ] Test response headers
        - [ ] Analyze results
        - [ ] Return detection result
      - [ ] testCorsCapability method
        - [ ] Try cross-origin fetch
        - [ ] Handle errors
        - [ ] Return support status
      - [ ] testRedirectBehavior method
        - [ ] Test 404 handling
        - [ ] Check SPA mode
        - [ ] Return behavior info
      - [ ] testResponseHeaders method
        - [ ] Fetch current page
        - [ ] Extract headers
        - [ ] Return header map
    - [ ] Implement getCapabilities method
      - [ ] Define capability maps
      - [ ] GitHub Pages capabilities
      - [ ] Netlify capabilities
      - [ ] Vercel capabilities
      - [ ] Local dev capabilities
      - [ ] Default capabilities
      - [ ] Return appropriate set

**Step 2: Environment-Specific Request Strategies** (Day 2-3)

- [ ] Create `src/environment/request-strategy.ts`
  - [ ] Define RequestStrategy interface
    - [ ] configureRequestManager method
    - [ ] adaptRequest method
    - [ ] handleFailure method
    - [ ] getDiscoveryStrategy method
  - [ ] Implement RequestStrategyFactory
    - [ ] Create static create method
    - [ ] Switch on environment type
    - [ ] Return appropriate strategy
  - [ ] Implement GitHubPagesStrategy
    - [ ] Constructor with environment
    - [ ] configureRequestManager method
      - [ ] Reduce concurrent requests to 3
      - [ ] Increase timeout to 15s
      - [ ] Lower circuit breaker threshold
      - [ ] Reduce retry attempts
    - [ ] adaptRequest method
      - [ ] Check for HEAD requests
      - [ ] Convert to GET with Range header
      - [ ] Log conversion
      - [ ] Return adapted request
    - [ ] handleFailure method
      - [ ] Check for 404 errors
      - [ ] Check for CORS errors
      - [ ] Try index.html fallback
      - [ ] Return retry decision
    - [ ] getDiscoveryStrategy method
      - [ ] Return 'conservative'
  - [ ] Implement NetlifyStrategy
    - [ ] Constructor with environment
    - [ ] configureRequestManager method
      - [ ] Increase concurrent to 6
      - [ ] Standard timeout
      - [ ] Normal thresholds
    - [ ] adaptRequest method
      - [ ] Return unchanged
    - [ ] handleFailure method
      - [ ] Check for 404s
      - [ ] Try pretty URL fallback
      - [ ] Return retry true
    - [ ] getDiscoveryStrategy method
      - [ ] Return 'aggressive'
  - [ ] Implement VercelStrategy
    - [ ] Similar to Netlify
    - [ ] Adjust for Vercel specifics
  - [ ] Implement LocalDevStrategy
    - [ ] Optimize for local development
    - [ ] Higher concurrent limits
    - [ ] No CORS restrictions
  - [ ] Implement DefaultStrategy
    - [ ] Conservative approach
    - [ ] Adapt based on capabilities
    - [ ] Minimal retries

**Step 3: Integration with Discovery System** (Day 3-4)

- [ ] Update `src/config-loader.ts`
  - [ ] Import environment modules
    - [ ] EnvironmentDetector
    - [ ] RequestStrategyFactory
  - [ ] Add requestStrategy field
  - [ ] Update loadConfig method
    - [ ] Detect environment first
    - [ ] Create request strategy
    - [ ] Configure request manager
    - [ ] Continue with loading
  - [ ] Update checkFileExists method
    - [ ] Adapt request with strategy
    - [ ] Handle failures with strategy
    - [ ] Try fallback URLs
    - [ ] Return existence result

- [ ] Update `src/auto-discovery.ts`
  - [ ] Import environment modules
  - [ ] Add environment awareness
  - [ ] Update discovery logic
    - [ ] Use environment strategy
    - [ ] Adapt discovery approach
    - [ ] Handle platform quirks
  - [ ] Update request methods
    - [ ] Apply request adaptations
    - [ ] Handle environment-specific errors

**Step 4: Environment-Specific UI Hints** (Day 4-5)

- [ ] Create `src/components/environment-banner.ts`
  - [ ] Implement EnvironmentBanner class
    - [ ] Create show static method
      - [ ] Check environment type
      - [ ] Show appropriate hint
    - [ ] Implement showGitHubPagesHint
      - [ ] Create banner element
      - [ ] Add informative message
      - [ ] Add manifest suggestion
      - [ ] Add learn more link
      - [ ] Add close button
      - [ ] Insert into DOM
      - [ ] Inject styles
    - [ ] Implement showManifestHelp
      - [ ] Create modal element
      - [ ] Add help content
      - [ ] Show manifest example
      - [ ] Show generation command
      - [ ] Add close button
      - [ ] Append to body
    - [ ] Implement injectBannerStyles
      - [ ] Check if styles exist
      - [ ] Create style element
      - [ ] Add banner styles
        - [ ] Banner container
        - [ ] Content layout
        - [ ] Button styles
        - [ ] Modal styles
        - [ ] Responsive adjustments
      - [ ] Append to head

- [ ] Update initialization flow
  - [ ] Import EnvironmentBanner
  - [ ] Detect environment
  - [ ] Show banner if needed
  - [ ] Store preference

## Testing Requirements

### Environment Simulation Tests

- [ ] Create `tests/environment/github-pages-simulation.test.ts`
  - [ ] Set up GitHub Pages mock
    - [ ] Block HEAD requests
    - [ ] Return HTML for 404s
    - [ ] Simulate CORS restrictions
  - [ ] Test HEAD request conversion
    - [ ] Verify converts to GET
    - [ ] Check Range header added
    - [ ] Verify response handling
  - [ ] Test conservative discovery
    - [ ] Check request count
    - [ ] Verify strategy applied
    - [ ] Test fallback behavior
  - [ ] Test error handling
    - [ ] Simulate CORS errors
    - [ ] Verify fallback URLs
    - [ ] Check retry logic

- [ ] Create `tests/environment/netlify-simulation.test.ts`
  - [ ] Set up Netlify mock
    - [ ] Allow all methods
    - [ ] Add Netlify headers
    - [ ] Simulate redirects
  - [ ] Test aggressive discovery
    - [ ] Verify higher limits
    - [ ] Check concurrent requests
    - [ ] Test performance
  - [ ] Test pretty URLs
    - [ ] Simulate \_redirects
    - [ ] Test .html stripping
    - [ ] Verify fallbacks

- [ ] Create `tests/environment/detection.test.ts`
  - [ ] Test URL-based detection
    - [ ] GitHub Pages URLs
    - [ ] Netlify URLs
    - [ ] Vercel URLs
    - [ ] Local dev URLs
  - [ ] Test behavior detection
    - [ ] Mock fetch responses
    - [ ] Test header detection
    - [ ] Test CORS detection
  - [ ] Test capability mapping
    - [ ] Verify correct capabilities
    - [ ] Test all environments

### Cross-Browser Testing

- [ ] Create `tests/integration/cross-browser.test.ts`
  - [ ] Test without fetch API
    - [ ] Remove fetch
    - [ ] Verify XHR fallback
    - [ ] Check functionality
  - [ ] Test Safari CORS quirks
    - [ ] Mock strict CORS
    - [ ] Verify handling
    - [ ] Check workarounds
  - [ ] Test older browsers
    - [ ] Remove modern APIs
    - [ ] Test polyfills
    - [ ] Verify degradation

## Success Metrics

- [ ] **Environment Detection**
  - [ ] 95% accuracy in detecting hosting environment
  - [ ] Detection completes in <100ms
  - [ ] Works across all major browsers

- [ ] **Compatibility**
  - [ ] GitHub Pages: 100% success rate with adapted requests
  - [ ] Netlify/Vercel: Optimal performance maintained
  - [ ] Unknown environments: Graceful degradation

- [ ] **Performance Impact**
  - [ ] No performance regression on modern platforms
  - [ ] GitHub Pages load time improved by 50%
  - [ ] Reduced failed requests by 80%

- [ ] **User Experience**
  - [ ] Clear guidance for environment-specific optimizations
  - [ ] Automatic adaptations require no user configuration
  - [ ] Helpful hints for manual optimizations

## Rollout Strategy

### Week 3 Schedule

**Monday**: Environment Detection Implementation

- [ ] Build detection system
- [ ] Create capability mappings

**Tuesday-Wednesday**: Request Strategy System

- [ ] Implement platform-specific strategies
- [ ] Create request adaptation layer

**Thursday**: Integration

- [ ] Integrate with ConfigLoader and AutoDiscovery
- [ ] Add environment-aware error handling

**Friday**: Testing and Documentation

- [ ] Cross-environment testing
- [ ] Performance validation
- [ ] Documentation updates

## Next Steps

After completing Phase 3:

- [ ] Full cross-environment compatibility achieved
- [ ] Platform-specific optimizations in place
- [ ] Ready for Phase 4: Advanced features (manifest support, user configuration)
