# C4 Model - Component Diagram: Document Container

## Level 3: Component View - Document Management

This diagram shows the internal structure of the Document Container.

```mermaid
graph TB
    subgraph "Document Container"
        subgraph "DocumentLoader Component"
            LOADER[DocumentLoader<br/>Main loader class]
            CACHE[Document Cache<br/>LRU cache]
            FETCH[Fetch Strategies<br/>Source handlers]

            subgraph "Loading Strategies"
                LOCAL[Local Loader<br/>File system]
                URL[URL Loader<br/>HTTP fetch]
                GH[GitHub Loader<br/>API integration]
                CONTENT[Content Loader<br/>Inline markdown]
            end
        end

        subgraph "Router Component"
            ROUTER[Router<br/>History management]
            MATCHER[Route Matcher<br/>Pattern matching]
            HANDLER[Route Handler<br/>Navigation logic]
        end

        subgraph "Navigation Component"
            NAV[Navigation<br/>Sidebar builder]
            TREE[Tree Builder<br/>Hierarchy generator]
            ACTIVE[Active Tracker<br/>Current location]
        end
    end

    subgraph "External APIs"
        HISTORY[History API]
        FETCH_API[Fetch API]
        GH_API[GitHub API]
    end

    LOADER --> CACHE
    LOADER --> FETCH
    FETCH --> LOCAL
    FETCH --> URL
    FETCH --> GH
    FETCH --> CONTENT

    ROUTER --> MATCHER
    ROUTER --> HANDLER
    ROUTER --> HISTORY

    NAV --> TREE
    NAV --> ACTIVE

    URL --> FETCH_API
    GH --> GH_API

    HANDLER --> LOADER
    ACTIVE --> ROUTER

    style LOADER fill:#0066cc,stroke:#333,stroke-width:4px,color:#fff
    style ROUTER fill:#0066cc,stroke:#333,stroke-width:4px,color:#fff
    style NAV fill:#0066cc,stroke:#333,stroke-width:4px,color:#fff
```

## Component Interactions

### DocumentLoader

```typescript
class DocumentLoader {
  private cache: LRUCache<string, ProcessedDocument>;
  private strategies: Map<SourceType, LoadStrategy>;
  private loadingPromises: Map<string, Promise<Document>>;

  async loadDocument(doc: Document): Promise<ProcessedDocument>;
  async loadAll(): Promise<Document[]>;
  private checkMemoryUsage(): void;
}
```

### Loading Strategies

Each strategy implements the `LoadStrategy` interface:

- **LocalLoader**: Fetches from relative paths
- **URLLoader**: HTTP/HTTPS with retry logic
- **GitHubLoader**: GitHub API with rate limiting
- **ContentLoader**: Processes inline markdown

### Router

```typescript
class Router {
  private history: History;
  private routes: Map<string, RouteHandler>;
  private currentRoute: string;

  navigate(path: string): void;
  back(): void;
  forward(): void;
  on(pattern: string, handler: RouteHandler): void;
}
```

### Navigation

```typescript
class Navigation {
  private documents: Document[];
  private activeDocument: string;
  private expandedNodes: Set<string>;

  render(): string;
  setActive(docId: string): void;
  toggle(nodeId: string): void;
  private buildTree(): TreeNode[];
}
```

## Data Flow Sequences

### Document Loading

```mermaid
sequenceDiagram
    participant Router
    participant Loader
    participant Strategy
    participant Cache
    participant API

    Router->>Loader: loadDocument(doc)
    Loader->>Cache: get(doc.id)

    alt Cached
        Cache-->>Loader: return cached
    else Not Cached
        Loader->>Strategy: load(doc)
        Strategy->>API: fetch content
        API-->>Strategy: raw content
        Strategy-->>Loader: processed
        Loader->>Cache: set(doc.id, processed)
    end

    Loader-->>Router: document ready
```

### Navigation Update

```mermaid
sequenceDiagram
    participant User
    participant Nav
    participant Router
    participant Loader

    User->>Nav: click link
    Nav->>Router: navigate(path)
    Router->>Loader: loadDocument(path)
    Loader-->>Router: document loaded
    Router->>Nav: setActive(path)
    Nav->>Nav: update UI
```

## Key Design Decisions

1. **Strategy Pattern**: Different loading strategies for different sources
2. **Caching**: LRU cache prevents redundant fetches
3. **Promise Deduplication**: Multiple requests for same document share promise
4. **Memory Management**: Automatic cache eviction on memory pressure
5. **Error Recovery**: Retry logic with exponential backoff
