/**
 * Environment adapters for platform-specific request handling
 * Week 1 deliverables - Agent B
 */

// Base adapter
export {
  BaseAdapter,
  RequestTransform,
  AdapterConfig
} from './base-adapter';

// Platform-specific adapters
export {
  GitHubPagesAdapter,
  GitHubPagesConfig
} from './github-pages-adapter';

export {
  NetlifyAdapter,
  NetlifyConfig
} from './netlify-adapter';

// Adapter factory for creating appropriate adapter based on environment
import { EnvironmentInfo, HostingEnvironment } from '../foundation/environment-utils';
import { BaseAdapter, AdapterConfig, RequestTransform } from './base-adapter';
import { GitHubPagesAdapter } from './github-pages-adapter';
import { NetlifyAdapter } from './netlify-adapter';

/**
 * Factory function to create appropriate adapter for detected environment
 */
export function createEnvironmentAdapter(environment: EnvironmentInfo): BaseAdapter {
  switch (environment.type) {
    case HostingEnvironment.GITHUB_PAGES:
      return new GitHubPagesAdapter(environment, {
        enableHeadToGetTransform: true,
        enableRangeHeaders: true,
        maxRetries: 3,
        timeoutMs: 10000
      });

    case HostingEnvironment.NETLIFY:
      return new NetlifyAdapter(environment, {
        enableFunctionDetection: true,
        enableRedirectHandling: true,
        enableEdgeCaching: true,
        maxRetries: 2,
        timeoutMs: 15000
      });

    case HostingEnvironment.VERCEL:
      // For now, use Netlify adapter as baseline (can be specialized later)
      return new NetlifyAdapter(environment, {
        enableFunctionDetection: true,
        enableRedirectHandling: true,
        maxRetries: 2,
        timeoutMs: 15000
      });

    case HostingEnvironment.LOCAL_DEV:
      // Local dev usually doesn't need special handling - use minimal concrete implementation
      return new (class extends BaseAdapter {
        async transformRequest(url: string, options?: RequestInit): Promise<RequestTransform> {
          return { url, options };
        }
        async handleFailedRequest(): Promise<RequestTransform | null> {
          return null;
        }
        getErrorSuggestions(error: Error, url: string): string[] {
          return this.getCommonSuggestions(error, url);
        }
      })(environment, {
        maxRetries: 1,
        timeoutMs: 5000,
        fallbackBehavior: 'error'
      });

    case HostingEnvironment.UNKNOWN:
    default:
      // Use conservative settings for unknown environments - minimal concrete implementation
      return new (class extends BaseAdapter {
        async transformRequest(url: string, options?: RequestInit): Promise<RequestTransform> {
          return { url, options };
        }
        async handleFailedRequest(): Promise<RequestTransform | null> {
          return null;
        }
        getErrorSuggestions(error: Error, url: string): string[] {
          return this.getCommonSuggestions(error, url);
        }
      })(environment, {
        maxRetries: 2,
        timeoutMs: 8000,
        fallbackBehavior: 'retry'
      });
  }
}

/**
 * Get adapter configuration recommendations for an environment
 */
export function getAdapterConfig(environment: EnvironmentInfo): AdapterConfig {
  const baseConfig: AdapterConfig = {
    maxRetries: 2,
    timeoutMs: 10000,
    enableCaching: true,
    fallbackBehavior: 'retry'
  };

  switch (environment.type) {
    case HostingEnvironment.GITHUB_PAGES:
      return {
        ...baseConfig,
        maxRetries: 3, // GitHub Pages can be flaky
        timeoutMs: 10000,
        customHeaders: {
          'User-Agent': 'MarkdownDocsViewer/1.0 (GitHub Pages)',
          'Accept': '*/*'
        }
      };

    case HostingEnvironment.NETLIFY:
      return {
        ...baseConfig,
        maxRetries: 2,
        timeoutMs: 15000, // Allow for function cold starts
        customHeaders: {
          'User-Agent': 'MarkdownDocsViewer/1.0 (Netlify)'
        }
      };

    case HostingEnvironment.VERCEL:
      return {
        ...baseConfig,
        maxRetries: 2,
        timeoutMs: 15000,
        customHeaders: {
          'User-Agent': 'MarkdownDocsViewer/1.0 (Vercel)'
        }
      };

    case HostingEnvironment.LOCAL_DEV:
      return {
        ...baseConfig,
        maxRetries: 1, // Fail fast in dev
        timeoutMs: 5000,
        enableCaching: false,
        customHeaders: {
          'Cache-Control': 'no-cache'
        }
      };

    default:
      return baseConfig;
  }
}