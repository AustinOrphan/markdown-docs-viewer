/**
 * Configuration fixtures for testing
 */

export interface TestConfig {
  title?: string;
  documents?: Array<{ path: string; title?: string; id?: string; content?: string }>;
  theme?: string;
  container?: string;
  search?: {
    enabled?: boolean;
    placeholder?: string;
  };
  navigation?: {
    showBreadcrumbs?: boolean;
  };
}

export const validBasicConfig: TestConfig = {
  title: 'Test Documentation',
  documents: [
    { path: 'README.md', title: 'Getting Started', id: 'readme' },
    { path: 'api.md', title: 'API Reference', id: 'api' }
  ]
};

export const validComplexConfig: TestConfig = {
  title: 'Complex Documentation',
  documents: [
    { path: 'README.md', title: 'Getting Started', id: 'readme' },
    { path: 'api.md', title: 'API Reference', id: 'api' },
    { path: 'guide.md', title: 'User Guide', id: 'guide' }
  ],
  theme: 'github-dark',
  search: { enabled: true, placeholder: 'Search docs...' },
  navigation: { showBreadcrumbs: true },
  container: '#docs-container'
};

export const emptyConfig: TestConfig = {};

export const invalidConfig: TestConfig = {
  title: 'Invalid Config',
  // Missing required documents array
};