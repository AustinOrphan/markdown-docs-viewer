/**
 * Week 3 Production Rollout Infrastructure
 * 
 * Comprehensive rollout system supporting Agent C's gradual deployment needs
 * with A/B testing, user cohort targeting, and intelligent rollback mechanisms.
 */

// Core rollout system
export {
  ProductionRollout,
  getGlobalProductionRollout,
  resetGlobalProductionRollout,
  OptimizationFeature,
  type UserCohortType,
  type UserCriteria,
  type UserCohort,
  type RollbackTriggers,
  type ABTestExperiment,
  type ABTestResults,
  type PerformanceMetrics,
  type RolloutPhase
} from './production-rollout';

// Agent C integration
export {
  AgentCIntegration,
  createAgentCIntegration,
  getDefaultAgentCConfig,
  type AgentCRolloutConfig,
  type RolloutStatus,
  type RolloutDecision
} from './agent-c-integration';

// Rollout utilities and helpers
export {
  RolloutUtils,
  calculateStatisticalSignificance,
  generateUserHash,
  validateRolloutConfig,
  type RolloutValidationResult
} from './rollout-utils';

// A/B testing framework
export {
  ABTestFramework,
  createABTest,
  analyzeABTestResults,
  type ABTestConfig,
  type ABTestMetrics,
  type StatisticalAnalysis
} from './ab-testing-framework';