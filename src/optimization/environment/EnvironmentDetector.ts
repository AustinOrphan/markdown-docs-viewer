/**
 * Environment Detection Module
 * Detects hosting environment and capabilities
 */

import { EnvironmentInfo, HostingEnvironment } from '../foundation/environment-utils';

export class EnvironmentDetector {
  static detect(): EnvironmentInfo {
    // Browser environment detection
    if (typeof window !== 'undefined') {
      const hostname = window.location?.hostname || '';
      
      if (hostname.includes('github.io')) {
        return {
          type: HostingEnvironment.GITHUB_PAGES,
          platform: 'browser',
          confidence: 0.9,
          indicators: ['github.io domain detected'],
          capabilities: {
            corsSupport: true,
            headRequests: false,
            maxConcurrentRequests: 4,
            supportsRangeRequests: false,
            hasCustomErrorPages: true,
            requiresAuthHeaders: false
          },
          detectedAt: new Date()
        };
      }
      
      if (hostname.includes('netlify.app') || hostname.includes('netlify.com')) {
        return {
          type: HostingEnvironment.NETLIFY,
          platform: 'browser',
          confidence: 0.9,
          indicators: ['netlify domain detected'],
          capabilities: {
            corsSupport: true,
            headRequests: true,
            maxConcurrentRequests: 10,
            supportsRangeRequests: true,
            hasCustomErrorPages: true,
            requiresAuthHeaders: false
          },
          detectedAt: new Date()
        };
      }
      
      if (hostname.includes('vercel.app')) {
        return {
          type: HostingEnvironment.VERCEL,
          platform: 'browser',
          confidence: 0.9,
          indicators: ['vercel domain detected'],
          capabilities: {
            corsSupport: true,
            headRequests: true,
            maxConcurrentRequests: 10,
            supportsRangeRequests: true,
            hasCustomErrorPages: true,
            requiresAuthHeaders: false
          },
          detectedAt: new Date()
        };
      }
      
      // Check for local development
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return {
          type: HostingEnvironment.LOCAL_DEV,
          platform: 'browser',
          confidence: 0.8,
          indicators: ['local hostname detected'],
          capabilities: {
            corsSupport: false,
            headRequests: true,
            maxConcurrentRequests: 8,
            supportsRangeRequests: true,
            hasCustomErrorPages: false,
            requiresAuthHeaders: false
          },
          detectedAt: new Date()
        };
      }
      
      return {
        type: HostingEnvironment.UNKNOWN,
        platform: 'browser',
        confidence: 0.5,
        indicators: ['browser environment, unknown hosting'],
        capabilities: {
          corsSupport: true,
          headRequests: true,
          maxConcurrentRequests: 6,
          supportsRangeRequests: false,
          hasCustomErrorPages: false,
          requiresAuthHeaders: false
        },
        detectedAt: new Date()
      };
    }
    
    // Node.js environment
    if (typeof process !== 'undefined') {
      return {
        type: HostingEnvironment.UNKNOWN,
        platform: 'node',
        confidence: 0.7,
        indicators: ['node.js environment detected'],
        capabilities: {
          corsSupport: true,
          headRequests: true,
          maxConcurrentRequests: 20,
          supportsRangeRequests: true,
          hasCustomErrorPages: false,
          requiresAuthHeaders: false
        },
        detectedAt: new Date()
      };
    }
    
    // Unknown environment
    return {
      type: HostingEnvironment.UNKNOWN,
      platform: 'unknown',
      confidence: 0.1,
      indicators: ['no environment indicators detected'],
      capabilities: {
        corsSupport: false,
        headRequests: false,
        maxConcurrentRequests: 1,
        supportsRangeRequests: false,
        hasCustomErrorPages: false,
        requiresAuthHeaders: false
      },
      detectedAt: new Date()
    };
  }
}