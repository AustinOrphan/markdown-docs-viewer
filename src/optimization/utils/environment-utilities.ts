/**
 * Production Environment Utilities
 * 
 * Production-safe utilities for environment detection and configuration
 * without dependencies on test utilities.
 */

export interface EnvironmentInfo {
  type: 'github-pages' | 'netlify' | 'vercel' | 'custom' | 'production';
  capabilities: {
    supportsHeadRequests: boolean;
    supportsParallelRequests: boolean;
    maxConcurrentRequests: number;
    hasCORS?: boolean;
    supportsDirectoryListing?: boolean;
  };
  config: {
    timeout: number;
    retryAttempts: number;
    baseUrl?: string;
  };
}

/**
 * Create a production environment configuration
 */
export function createProductionEnvironment(): EnvironmentInfo {
  return {
    type: 'production',
    capabilities: {
      supportsHeadRequests: true,
      supportsParallelRequests: true,
      maxConcurrentRequests: 10,
      hasCORS: false,
      supportsDirectoryListing: true,
    },
    config: {
      timeout: 30000,
      retryAttempts: 3,
    }
  };
}

/**
 * Create a GitHub Pages environment configuration
 */
export function createGitHubPagesEnvironment(): EnvironmentInfo {
  return {
    type: 'github-pages',
    capabilities: {
      supportsHeadRequests: false, // GitHub Pages blocks HEAD requests
      supportsParallelRequests: true,
      maxConcurrentRequests: 6,
      hasCORS: true,
      supportsDirectoryListing: false,
    },
    config: {
      timeout: 15000,
      retryAttempts: 2,
    }
  };
}

/**
 * Create a Netlify environment configuration
 */
export function createNetlifyEnvironment(): EnvironmentInfo {
  return {
    type: 'netlify',
    capabilities: {
      supportsHeadRequests: true,
      supportsParallelRequests: true,
      maxConcurrentRequests: 12,
      hasCORS: false,
      supportsDirectoryListing: true,
    },
    config: {
      timeout: 25000,
      retryAttempts: 3,
    }
  };
}

/**
 * Create a Vercel environment configuration
 */
export function createVercelEnvironment(): EnvironmentInfo {
  return {
    type: 'vercel',
    capabilities: {
      supportsHeadRequests: true,
      supportsParallelRequests: true,
      maxConcurrentRequests: 15,
      hasCORS: false,
      supportsDirectoryListing: true,
    },
    config: {
      timeout: 20000,
      retryAttempts: 3,
    }
  };
}

/**
 * Detect current environment based on URL and capabilities
 */
export function detectEnvironment(baseUrl?: string): EnvironmentInfo {
  if (!baseUrl && typeof window !== 'undefined') {
    baseUrl = window.location.origin;
  }

  if (!baseUrl) {
    return createProductionEnvironment();
  }

  // Detect based on hostname patterns
  if (baseUrl.includes('github.io') || baseUrl.includes('githubusercontent.com')) {
    return createGitHubPagesEnvironment();
  }

  if (baseUrl.includes('netlify.app') || baseUrl.includes('netlify.com')) {
    return createNetlifyEnvironment();
  }

  if (baseUrl.includes('vercel.app') || baseUrl.includes('vercel.com')) {
    return createVercelEnvironment();
  }

  // Default to production environment
  return createProductionEnvironment();
}