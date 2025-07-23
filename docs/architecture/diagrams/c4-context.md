# C4 Model - System Context Diagram

## Level 1: System Context

This diagram shows the Markdown Docs Viewer in the context of its users and external systems.

```mermaid
graph TB
    subgraph "Users"
        DEV[Developer<br/>Uses library in application]
        END[End User<br/>Reads documentation]
    end

    subgraph "Markdown Docs Viewer System"
        MDV[Markdown Docs Viewer<br/>JavaScript Library]
    end

    subgraph "External Systems"
        GH[GitHub API<br/>Repository content]
        CDN[CDN<br/>Remote markdown files]
        FS[File System<br/>Local markdown files]
    end

    subgraph "Dependencies"
        NPM[NPM Registry<br/>Package distribution]
        DEPS[Peer Dependencies<br/>marked, highlight.js]
    end

    DEV -->|Integrates| MDV
    END -->|Views docs| MDV
    MDV -->|Fetches content| GH
    MDV -->|Loads files| CDN
    MDV -->|Reads| FS
    MDV -->|Depends on| DEPS
    DEV -->|Installs from| NPM

    style MDV fill:#0066cc,stroke:#333,stroke-width:4px,color:#fff
    style DEV fill:#f9f,stroke:#333,stroke-width:2px
    style END fill:#f9f,stroke:#333,stroke-width:2px
```

## Key Relationships

### Users

- **Developers**: Integrate the library into their web applications
- **End Users**: Read documentation through the rendered interface

### External Systems

- **GitHub API**: Fetch documentation directly from repositories
- **CDN**: Load remote markdown files via HTTP/HTTPS
- **File System**: Read local markdown files (in development)

### Dependencies

- **NPM Registry**: Distribution and versioning
- **Peer Dependencies**: Core markdown parsing and syntax highlighting

## System Boundaries

The Markdown Docs Viewer is a self-contained JavaScript library that:

- Runs entirely in the browser (no server required)
- Handles all markdown parsing and rendering
- Manages themes, navigation, and search internally
- Provides a complete documentation viewing experience
