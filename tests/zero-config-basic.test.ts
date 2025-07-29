import { describe, it, expect, vi } from 'vitest';

describe('Zero Config Basic Coverage', () => {
  it('should import zero-config functions', async () => {
    const zeroConfig = await import('../src/zero-config');

    expect(typeof zeroConfig.getAvailableThemes).toBe('function');
    expect(typeof zeroConfig.generateConfig).toBe('function');
    expect(typeof zeroConfig.getViewer).toBe('function');
    expect(typeof zeroConfig.setTheme).toBe('function');
    expect(typeof zeroConfig.reload).toBe('function');
  });

  it('should call getAvailableThemes', async () => {
    const { getAvailableThemes } = await import('../src/zero-config');
    const themes = getAvailableThemes();
    expect(Array.isArray(themes)).toBe(true);
  });

  it('should call getViewer when no viewer exists', async () => {
    const { getViewer } = await import('../src/zero-config');
    const viewer = getViewer();
    expect(viewer).toBeNull();
  });

  it('should warn when setting theme without viewer', async () => {
    const { setTheme } = await import('../src/zero-config');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    setTheme('github-dark');

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
