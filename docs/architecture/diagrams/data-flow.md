# Data Flow Diagrams

## Document Loading and Rendering Flow

```mermaid
graph TB
    subgraph "Input Sources"
        LOCAL[Local Files]
        URL[Remote URLs]
        GITHUB[GitHub API]
        INLINE[Inline Content]
    end

    subgraph "Document Processing"
        LOADER[Document Loader]
        CACHE[LRU Cache]
        PARSER[Markdown Parser]
        HIGHLIGHT[Syntax Highlighter]
        SANITIZER[HTML Sanitizer]
    end

    subgraph "Content Enhancement"
        TOC[TOC Generator]
        SEARCH_INDEX[Search Indexer]
        HEADING_ID[Heading ID Generator]
        LINK_PROC[Link Processor]
    end

    subgraph "Rendering"
        RENDERER[HTML Renderer]
        THEME[Theme Application]
        MOBILE[Mobile Adaptation]
    end

    subgraph "User Interface"
        VIEWER[Main Viewer]
        NAV[Navigation Sidebar]
        SEARCH[Search Interface]
        CONTENT[Content Area]
    end

    LOCAL --> LOADER
    URL --> LOADER
    GITHUB --> LOADER
    INLINE --> LOADER

    LOADER --> CACHE
    CACHE --> PARSER
    PARSER --> HIGHLIGHT
    HIGHLIGHT --> SANITIZER

    SANITIZER --> TOC
    SANITIZER --> SEARCH_INDEX
    SANITIZER --> HEADING_ID
    SANITIZER --> LINK_PROC

    TOC --> RENDERER
    HEADING_ID --> RENDERER
    LINK_PROC --> RENDERER

    RENDERER --> THEME
    THEME --> MOBILE

    MOBILE --> VIEWER
    VIEWER --> NAV
    VIEWER --> SEARCH
    VIEWER --> CONTENT

    SEARCH_INDEX --> SEARCH
```

## Search Flow

```mermaid
sequenceDiagram
    participant User
    participant SearchUI
    participant SearchManager
    participant SearchIndex
    participant Cache
    participant Results

    User->>SearchUI: Type query
    SearchUI->>SearchUI: Debounce (300ms)
    SearchUI->>SearchManager: search(query)

    SearchManager->>Cache: checkCache(query)
    alt Cached results
        Cache-->>SearchManager: Return cached
    else No cache
        SearchManager->>SearchIndex: query(terms)
        SearchIndex->>SearchIndex: Tokenize
        SearchIndex->>SearchIndex: Score matches
        SearchIndex-->>SearchManager: Ranked results
        SearchManager->>Cache: store(query, results)
    end

    SearchManager->>Results: Format results
    Results->>SearchUI: Display results
    SearchUI->>User: Show matches
```

## Theme Application Flow

```mermaid
graph LR
    subgraph "Theme Selection"
        USER[User Selection]
        SYSTEM[System Preference]
        SAVED[Saved Preference]
    end

    subgraph "Theme Resolution"
        MANAGER[Theme Manager]
        REGISTRY[Theme Registry]
        VALIDATOR[Theme Validator]
    end

    subgraph "CSS Generation"
        VARS[CSS Variables]
        CALC[Calculated Values]
        RGB[RGB Values]
    end

    subgraph "DOM Updates"
        ROOT[Root Element]
        ATTR[Data Attributes]
        STYLES[Inline Styles]
    end

    USER --> MANAGER
    SYSTEM --> MANAGER
    SAVED --> MANAGER

    MANAGER --> REGISTRY
    REGISTRY --> VALIDATOR

    VALIDATOR --> VARS
    VARS --> CALC
    CALC --> RGB

    RGB --> ROOT
    ROOT --> ATTR
    ROOT --> STYLES
```

## Navigation State Management

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Loading: User clicks link
    Idle --> Loading: URL change
    Idle --> Loading: Back/Forward

    Loading --> Fetching: Document not cached
    Loading --> Rendering: Document cached

    Fetching --> Parsing: Content received
    Fetching --> Error: Fetch failed

    Parsing --> Rendering: Parse complete
    Parsing --> Error: Parse failed

    Rendering --> Active: Render complete

    Active --> Idle: Ready for navigation
    Active --> Scrolling: User scrolls

    Scrolling --> Active: Update TOC highlight

    Error --> Idle: Retry
    Error --> Idle: Navigate away
```

## Performance Optimization Flow

```mermaid
graph TB
    subgraph "Memory Management"
        MONITOR[Memory Monitor]
        PRESSURE[Pressure Detection]
        CLEANUP[Cleanup Tasks]
        GC[Garbage Collection]
    end

    subgraph "Caching Strategy"
        LRU[LRU Cache]
        PERSIST[Persistent Cache]
        INVALIDATE[Cache Invalidation]
    end

    subgraph "Lazy Loading"
        OBSERVER[Intersection Observer]
        LOADER[Resource Loader]
        PRIORITY[Priority Queue]
    end

    subgraph "Optimization"
        DEBOUNCE[Event Debouncing]
        THROTTLE[Scroll Throttling]
        RAF[Request Animation Frame]
    end

    MONITOR --> PRESSURE
    PRESSURE --> CLEANUP
    CLEANUP --> GC

    LRU --> PERSIST
    PERSIST --> INVALIDATE

    OBSERVER --> LOADER
    LOADER --> PRIORITY

    DEBOUNCE --> RAF
    THROTTLE --> RAF

    GC --> LRU
    PRIORITY --> LRU
```

## Error Handling and Recovery Flow

```mermaid
graph TB
    subgraph "Error Sources"
        NETWORK[Network Error]
        PARSE[Parse Error]
        RENDER[Render Error]
        API[API Error]
    end

    subgraph "Error Processing"
        HANDLER[Error Handler]
        CLASSIFIER[Error Classifier]
        LOGGER[Error Logger]
    end

    subgraph "Recovery Strategies"
        RETRY[Retry Logic]
        FALLBACK[Fallback Content]
        CACHE[Use Cached]
        NOTIFY[User Notification]
    end

    subgraph "Resolution"
        SUCCESS[Success]
        DEGRADE[Degraded Mode]
        FAIL[Final Failure]
    end

    NETWORK --> HANDLER
    PARSE --> HANDLER
    RENDER --> HANDLER
    API --> HANDLER

    HANDLER --> CLASSIFIER
    CLASSIFIER --> LOGGER

    CLASSIFIER --> RETRY
    CLASSIFIER --> FALLBACK
    CLASSIFIER --> CACHE
    CLASSIFIER --> NOTIFY

    RETRY --> SUCCESS
    RETRY --> FAIL
    FALLBACK --> DEGRADE
    CACHE --> DEGRADE
    NOTIFY --> FAIL
```

## Component Communication Flow

```mermaid
graph TB
    subgraph "Event System"
        EMITTER[Event Emitter]
        BUS[Event Bus]
        LISTENERS[Event Listeners]
    end

    subgraph "State Updates"
        VIEWER_STATE[Viewer State]
        NAV_STATE[Navigation State]
        THEME_STATE[Theme State]
        SEARCH_STATE[Search State]
    end

    subgraph "UI Components"
        VIEWER_UI[Viewer Component]
        NAV_UI[Navigation Component]
        THEME_UI[Theme Component]
        SEARCH_UI[Search Component]
    end

    VIEWER_UI --> EMITTER
    NAV_UI --> EMITTER
    THEME_UI --> EMITTER
    SEARCH_UI --> EMITTER

    EMITTER --> BUS
    BUS --> LISTENERS

    LISTENERS --> VIEWER_STATE
    LISTENERS --> NAV_STATE
    LISTENERS --> THEME_STATE
    LISTENERS --> SEARCH_STATE

    VIEWER_STATE --> VIEWER_UI
    NAV_STATE --> NAV_UI
    THEME_STATE --> THEME_UI
    SEARCH_STATE --> SEARCH_UI
```
