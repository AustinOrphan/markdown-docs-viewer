/**
 * Optimization Managers
 * Request management and pooling systems for optimization
 */

// Request Pool Manager exports
export {
  RequestPoolManager,
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
} from './request-pool-manager';