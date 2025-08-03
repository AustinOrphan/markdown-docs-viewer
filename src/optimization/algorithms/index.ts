/**
 * Optimization Algorithms
 * Core algorithms for the Zero-Config Optimization system
 */

// Smart Config Discovery exports
export {
  SmartConfigDiscovery,
  createSmartConfigDiscovery,
  getGlobalSmartConfigDiscovery,
  resetGlobalSmartConfigDiscovery,
  type ConfigResult,
  type ConfigDiscoveryOptions
} from './smart-config-discovery';

// Re-export types for convenience
export type { DocsConfig } from '../../config-loader';