import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAvailableThemes,
  generateConfig,
} from '../src/zero-config';

// Mock dependencies
vi.mock('../src/config-loader');
vi.mock('../src/auto-discovery');
vi.mock('../src/factory');
vi.mock('../src/viewer');

describe('Zero Config API - Simple Tests', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAvailableThemes', () => {
    it('should return all available theme variants', () => {
      const availableThemes = getAvailableThemes();

      expect(availableThemes).toBeInstanceOf(Array);
      expect(availableThemes.length).toBeGreaterThan(0);
      expect(availableThemes).toContain('default-light');
      expect(availableThemes).toContain('default-dark');
      expect(availableThemes).toContain('github-light');
      expect(availableThemes).toContain('github-dark');
    });
  });

  describe('generateConfig', () => {
    it('should return sample configuration', () => {
      // Mock the static method
      const { ConfigLoader } = require('../src/config-loader');
      ConfigLoader.generateSampleConfig = vi.fn().mockReturnValue('sample config');

      const config = generateConfig();

      expect(config).toBe('sample config');
    });
  });
});