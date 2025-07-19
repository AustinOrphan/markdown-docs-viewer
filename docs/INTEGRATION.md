# Integration Guide

Framework-specific integration examples and best practices for the Markdown Documentation Viewer.

## React Integration

### Basic Setup
```jsx
import React, { useEffect, useRef } from 'react';
import { MarkdownDocsViewer } from 'markdown-docs-viewer';

function DocumentationPage() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const config = {
      title: 'React App Documentation',
      sources: [
        { type: 'local', path: './docs/' }
      ],
      theme: {
        default: 'light',
        allowUserToggle: true
      }
    };

    viewerRef.current = new MarkdownDocsViewer(containerRef.current, config);
    viewerRef.current.initialize();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, []);

  return <div ref={containerRef} className="docs-container" />;
}

export default DocumentationPage;
```

### React Hook
Create a custom hook for easier integration:

```jsx
import { useEffect, useRef, useState } from 'react';
import { MarkdownDocsViewer } from 'markdown-docs-viewer';

export function useMarkdownViewer(config) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        viewerRef.current = new MarkdownDocsViewer(containerRef.current, {
          ...config,
          callbacks: {
            ...config.callbacks,
            onError: (err, context) => {
              setError({ error: err, context });
              config.callbacks?.onError?.(err, context);
            }
          }
        });
        
        await viewerRef.current.initialize();
        setIsLoading(false);
      } catch (err) {
        setError({ error: err, context: 'initialization' });
        setIsLoading(false);
      }
    };

    if (containerRef.current) {
      initViewer();
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
      }
    };
  }, [config]);

  return {
    containerRef,
    viewer: viewerRef.current,
    isLoading,
    error
  };
}

// Usage
function DocsPage() {
  const config = {
    title: 'My Docs',
    sources: [{ type: 'local', path: './docs/' }]
  };

  const { containerRef, viewer, isLoading, error } = useMarkdownViewer(config);

  if (isLoading) return <div>Loading documentation...</div>;
  if (error) return <div>Error: {error.error.message}</div>;

  return <div ref={containerRef} className="h-screen" />;
}
```

### Next.js Integration
```jsx
// pages/docs.js
import dynamic from 'next/dynamic';

const DocsViewer = dynamic(() => import('../components/DocsViewer'), {
  ssr: false,
  loading: () => <p>Loading documentation...</p>
});

export default function DocsPage() {
  return (
    <div className="container mx-auto">
      <DocsViewer />
    </div>
  );
}

// components/DocsViewer.js
import { useEffect, useRef } from 'react';
import { MarkdownDocsViewer } from 'markdown-docs-viewer';

export default function DocsViewer() {
  const containerRef = useRef(null);

  useEffect(() => {
    const viewer = new MarkdownDocsViewer(containerRef.current, {
      title: 'Next.js App Docs',
      sources: [
        { type: 'github', owner: 'your-org', repo: 'docs', branch: 'main' }
      ],
      callbacks: {
        onNavigationChange: (path) => {
          // Update Next.js router
          window.history.pushState(null, '', `/docs#${path}`);
        }
      }
    });

    viewer.initialize();

    return () => viewer.destroy();
  }, []);

  return <div ref={containerRef} className="min-h-screen" />;
}
```

## Vue.js Integration

### Vue 3 Composition API
```vue
<template>
  <div ref="docsContainer" class="docs-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { MarkdownDocsViewer } from 'markdown-docs-viewer';

const docsContainer = ref(null);
let viewer = null;

const props = defineProps({
  config: {
    type: Object,
    required: true
  }
});

onMounted(async () => {
  viewer = new MarkdownDocsViewer(docsContainer.value, props.config);
  await viewer.initialize();
});

onUnmounted(() => {
  if (viewer) {
    viewer.destroy();
  }
});
</script>

<style scoped>
.docs-container {
  height: 100vh;
  width: 100%;
}
</style>
```

### Vue 2 Options API
```vue
<template>
  <div ref="docsContainer" class="docs-container"></div>
</template>

<script>
import { MarkdownDocsViewer } from 'markdown-docs-viewer';

export default {
  name: 'DocumentationViewer',
  props: {
    config: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      viewer: null
    };
  },
  async mounted() {
    this.viewer = new MarkdownDocsViewer(this.$refs.docsContainer, this.config);
    await this.viewer.initialize();
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }
};
</script>
```

### Nuxt.js Integration
```vue
<!-- pages/docs.vue -->
<template>
  <div>
    <client-only>
      <docs-viewer :config="docsConfig" />
    </client-only>
  </div>
</template>

<script>
export default {
  data() {
    return {
      docsConfig: {
        title: 'Nuxt.js Documentation',
        sources: [
          { type: 'local', path: './content/docs/' }
        ]
      }
    };
  }
};
</script>
```

## Angular Integration

### Component Implementation
```typescript
// docs-viewer.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, Input } from '@angular/core';
import { MarkdownDocsViewer, DocumentationConfig } from 'markdown-docs-viewer';

@Component({
  selector: 'app-docs-viewer',
  template: '<div #docsContainer class="docs-container"></div>',
  styleUrls: ['./docs-viewer.component.css']
})
export class DocsViewerComponent implements OnInit, OnDestroy {
  @ViewChild('docsContainer', { static: true }) docsContainer!: ElementRef;
  @Input() config!: DocumentationConfig;
  
  private viewer: MarkdownDocsViewer | null = null;

  ngOnInit() {
    this.initializeViewer();
  }

  ngOnDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
    }
  }

  private async initializeViewer() {
    this.viewer = new MarkdownDocsViewer(
      this.docsContainer.nativeElement,
      this.config
    );
    
    try {
      await this.viewer.initialize();
    } catch (error) {
      console.error('Failed to initialize documentation viewer:', error);
    }
  }
}
```

```css
/* docs-viewer.component.css */
.docs-container {
  height: 100vh;
  width: 100%;
}
```

### Module Configuration
```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { DocsViewerComponent } from './docs-viewer/docs-viewer.component';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    DocsViewerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Usage in Parent Component
```typescript
// app.component.ts
import { Component } from '@angular/core';
import { DocumentationConfig } from 'markdown-docs-viewer';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <app-docs-viewer [config]="docsConfig"></app-docs-viewer>
    </div>
  `
})
export class AppComponent {
  docsConfig: DocumentationConfig = {
    title: 'Angular App Documentation',
    sources: [
      { type: 'local', path: './assets/docs/' }
    ],
    theme: {
      default: 'light',
      allowUserToggle: true
    },
    callbacks: {
      onDocumentLoad: (document) => {
        console.log('Loaded document:', document.title);
      }
    }
  };
}
```

## Svelte Integration

### Basic Component
```svelte
<!-- DocsViewer.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { MarkdownDocsViewer } from 'markdown-docs-viewer';

  export let config;
  
  let docsContainer;
  let viewer;

  onMount(async () => {
    viewer = new MarkdownDocsViewer(docsContainer, config);
    await viewer.initialize();
  });

  onDestroy(() => {
    if (viewer) {
      viewer.destroy();
    }
  });
</script>

<div bind:this={docsContainer} class="docs-container"></div>

<style>
  .docs-container {
    height: 100vh;
    width: 100%;
  }
</style>
```

### SvelteKit Integration
```svelte
<!-- src/routes/docs/+page.svelte -->
<script>
  import { browser } from '$app/environment';
  import DocsViewer from '$lib/components/DocsViewer.svelte';

  const config = {
    title: 'SvelteKit Documentation',
    sources: [
      { type: 'local', path: './static/docs/' }
    ]
  };
</script>

<svelte:head>
  <title>Documentation</title>
</svelte:head>

{#if browser}
  <DocsViewer {config} />
{:else}
  <div class="loading">Loading documentation...</div>
{/if}
```

## Vanilla JavaScript

### Basic Setup
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentation</title>
</head>
<body>
  <div id="docs-container"></div>
  
  <script type="module">
    import { MarkdownDocsViewer } from './node_modules/markdown-docs-viewer/dist/index.js';

    const config = {
      title: 'My Documentation',
      sources: [
        { type: 'local', path: './docs/' }
      ]
    };

    const viewer = new MarkdownDocsViewer(
      document.getElementById('docs-container'),
      config
    );

    viewer.initialize();
  </script>
</body>
</html>
```

### ES5 with UMD Build
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Documentation</title>
  <script src="./node_modules/markdown-docs-viewer/dist/index.umd.js"></script>
</head>
<body>
  <div id="docs-container"></div>
  
  <script>
    var config = {
      title: 'Legacy Documentation',
      sources: [
        { type: 'url', url: './docs/getting-started.md' }
      ]
    };

    var viewer = new MarkdownDocsViewer.MarkdownDocsViewer(
      document.getElementById('docs-container'),
      config
    );

    viewer.initialize();
  </script>
</body>
</html>
```

## WordPress Integration

### Plugin Development
```php
<?php
// wp-content/plugins/markdown-docs/markdown-docs.php

function enqueue_markdown_docs_scripts() {
    wp_enqueue_script(
        'markdown-docs-viewer',
        plugin_dir_url(__FILE__) . 'dist/index.umd.js',
        array(),
        '1.0.0',
        true
    );
}
add_action('wp_enqueue_scripts', 'enqueue_markdown_docs_scripts');

function markdown_docs_shortcode($atts) {
    $atts = shortcode_atts(array(
        'title' => 'Documentation',
        'source' => '',
    ), $atts);

    $unique_id = 'docs-' . uniqid();
    
    ob_start();
    ?>
    <div id="<?php echo $unique_id; ?>" class="markdown-docs-container"></div>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        new MarkdownDocsViewer.MarkdownDocsViewer(
            document.getElementById('<?php echo $unique_id; ?>'),
            {
                title: '<?php echo esc_js($atts['title']); ?>',
                sources: [
                    { type: 'url', url: '<?php echo esc_url($atts['source']); ?>' }
                ]
            }
        ).initialize();
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('markdown_docs', 'markdown_docs_shortcode');
?>
```

### Usage in WordPress
```
[markdown_docs title="API Documentation" source="https://example.com/api-docs.md"]
```

## Common Integration Patterns

### Dynamic Configuration
```javascript
// Load configuration from API
async function createViewer() {
  const response = await fetch('/api/docs-config');
  const config = await response.json();
  
  const viewer = new MarkdownDocsViewer(
    document.getElementById('docs-container'),
    config
  );
  
  await viewer.initialize();
  return viewer;
}
```

### Multi-language Support
```javascript
const config = {
  title: 'Documentation',
  sources: [
    { 
      type: 'local', 
      path: `./docs/${getUserLanguage()}/` 
    }
  ],
  callbacks: {
    onDocumentLoad: (document) => {
      // Update page language
      document.documentElement.lang = getUserLanguage();
    }
  }
};
```

### Authentication Headers
```javascript
const config = {
  sources: [
    {
      type: 'url',
      url: 'https://api.example.com/docs/secure.md',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  ]
};
```

### Error Boundaries (React)
```jsx
class DocsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Documentation viewer error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong loading the documentation.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<DocsErrorBoundary>
  <DocsViewer config={config} />
</DocsErrorBoundary>
```

## Best Practices

### Performance
- Load the viewer only when needed (lazy loading)
- Use code splitting for large applications
- Implement proper cleanup in component unmount handlers

### Accessibility
- Ensure container has proper ARIA labels
- Test with screen readers
- Provide keyboard navigation alternatives

### SEO
- Pre-render content for search engines when possible
- Use semantic HTML structure
- Implement proper meta tags for documentation pages

### Error Handling
- Always implement error boundaries/handlers
- Provide fallback content for failed loads
- Log errors for debugging and monitoring