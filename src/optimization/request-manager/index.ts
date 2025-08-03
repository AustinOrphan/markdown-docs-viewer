// Request Manager with pooling and circuit breaker
// Week 2 deliverables - Agent A - Points to actual implementations

// Export from the managers directory where implementations exist
export {
  RequestPoolManager as RequestManager,
  createRequestPoolManager,
  getGlobalRequestPoolManager,
  resetGlobalRequestPoolManager,
  CircuitBreakerState,
  type RequestBatch,
  type CircuitBreakerConfig,
  type RateLimitConfig,
  type PoolManagerConfig,
  type RequestResult,
  type CircuitBreakerStats
} from '../managers/request-pool-manager';

// Circuit breaker functionality is included in RequestPoolManager
export { CircuitBreakerState as CircuitBreaker } from '../managers/request-pool-manager';

// Request pool functionality is included in RequestPoolManager
export { RequestPoolManager as RequestPool } from '../managers/request-pool-manager';
