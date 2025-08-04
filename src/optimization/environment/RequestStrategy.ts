/**
 * Request Strategy Module
 * Provides environment-specific request strategies
 */

import { EnvironmentInfo, HostingEnvironment } from '../foundation/environment-utils';

export interface RequestStrategy {
  name: string;
  shouldUseHeadRequests: boolean;
  maxConcurrentRequests: number;
  timeoutMs: number;
  retryAttempts: number;
}

export class RequestStrategyFactory {
  static createStrategy(environment: EnvironmentInfo): RequestStrategy {
    switch (environment.type) {
      case HostingEnvironment.GITHUB_PAGES:
        return {
          name: 'GitHubPages',
          shouldUseHeadRequests: false,
          maxConcurrentRequests: 4,
          timeoutMs: 10000,
          retryAttempts: 2
        };
        
      case HostingEnvironment.NETLIFY:
        return {
          name: 'Netlify',
          shouldUseHeadRequests: true,
          maxConcurrentRequests: 8,
          timeoutMs: 15000,
          retryAttempts: 3
        };
        
      case HostingEnvironment.VERCEL:
        return {
          name: 'Vercel',
          shouldUseHeadRequests: true,
          maxConcurrentRequests: 10,
          timeoutMs: 12000,
          retryAttempts: 3
        };
        
      case HostingEnvironment.LOCAL_DEV:
        return {
          name: 'LocalDev',
          shouldUseHeadRequests: true,
          maxConcurrentRequests: 8,
          timeoutMs: 5000,
          retryAttempts: 1
        };
        
      case HostingEnvironment.UNKNOWN:
      default:
        return {
          name: 'Default',
          shouldUseHeadRequests: true,
          maxConcurrentRequests: 6,
          timeoutMs: 8000,
          retryAttempts: 2
        };
    }
  }
}