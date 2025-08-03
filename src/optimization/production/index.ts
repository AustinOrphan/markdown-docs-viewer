/**
 * Week 3 Production Performance Optimization Module
 * 
 * Comprehensive production-ready performance optimizations including:
 * - Memory management and leak detection
 * - Network efficiency and request optimization
 * - Cache performance and compression
 * - Mobile network optimizations
 * - Garbage collection optimization
 */

// Core production performance optimizer
export {
  ProductionPerformanceOptimizer,
  getGlobalProductionOptimizer,
  optimizeForProduction,
  type ProductionPerformanceConfig,
  type PerformanceMetrics
} from './performance-optimizer';

// Performance monitoring and analytics
export {
  ProductionMonitoring,
  createProductionMonitoring,
  type ProductionMetrics,
  type ProductionAlert
} from './production-monitoring';

// Advanced analytics and insights
export {
  ProductionAnalytics,
  getGlobalProductionAnalytics,
  trackOptimization,
  trackPerformance,
  generateAnalyticsReport,
  type AnalyticsEvent,
  type UserExperienceMetrics,
  type OptimizationInsights,
  type AnalyticsReport
} from './production-analytics';

// Memory optimization utilities
export {
  MemoryOptimizer,
  type MemoryOptimizationConfig,
  type MemoryMetrics
} from './memory-optimizer';

// Network optimization utilities
export {
  NetworkOptimizer,
  type NetworkOptimizationConfig,
  type NetworkMetrics
} from './network-optimizer';

// Cache optimization utilities
export {
  CacheOptimizer,
  type CacheOptimizationConfig,
  type CacheMetrics
} from './cache-optimizer';

// Production utilities and helpers
export {
  ProductionUtils,
  detectProductionEnvironment,
  getProductionConfig,
  validateProductionReadiness
} from './production-utils';