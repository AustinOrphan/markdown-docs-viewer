/**
 * Auto-discovery system for markdown files
 * Automatically finds and processes markdown files from a directory structure
 */

import { Document } from './types';

export interface AutoDiscoveryOptions {
  basePath: string;
  exclude?: string[];
  titleStrategy?: 'filename' | 'heading' | 'frontmatter';
  sortStrategy?: 'alphabetical' | 'date' | 'custom';
  categoryStrategy?: 'folder' | 'frontmatter' | 'none';
}

export interface FileInfo {
  path: string;
  name: string;
  title?: string;
  category?: string;
  order?: number;
  lastModified?: Date;
  content?: string;
}

/**
 * Auto-discovers markdown files and converts them to Document objects
 */
export class AutoDiscovery {
  private options: Required<AutoDiscoveryOptions>;

  constructor(options: AutoDiscoveryOptions) {
    this.options = {
      basePath: options.basePath,
      exclude: options.exclude || ['**/node_modules/**', '**/.*', '**/_*'],
      titleStrategy: options.titleStrategy || 'heading',
      sortStrategy: options.sortStrategy || 'alphabetical',
      categoryStrategy: options.categoryStrategy || 'folder',
    };
  }

  /**
   * Discovers all markdown files in the specified directory
   */
  async discoverFiles(): Promise<Document[]> {
    try {
      // Add timeout to prevent hanging in CI
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('File discovery timeout')), 30000);
      });

      const discoveryPromise = this.performDiscovery();

      return await Promise.race([discoveryPromise, timeoutPromise]);
    } catch (error) {
      console.warn('Auto-discovery failed:', error);
      return [];
    }
  }

  private async performDiscovery(): Promise<Document[]> {
    const files = await this.scanDirectory(this.options.basePath);
    const documents = await Promise.all(files.map(file => this.processFile(file)));

    return this.sortDocuments(documents.filter(doc => doc !== null) as Document[]);
  }

  /**
   * Scans directory for markdown files (browser-compatible approach)
   */
  private async scanDirectory(basePath: string): Promise<FileInfo[]> {
    // In a real implementation, this would need to be server-side or use a build step
    // For now, we'll implement a client-side approach that works with common patterns

    const commonFiles = [
      'README.md',
      'index.md',
      'getting-started.md',
      'installation.md',
      'configuration.md',
      'api.md',
      'examples.md',
      'troubleshooting.md',
      'changelog.md',
      'contributing.md',
    ];

    const commonPaths = ['', 'guides/', 'api/', 'reference/', 'tutorials/', 'examples/'];

    const files: FileInfo[] = [];

    // Try common file patterns
    for (const dir of commonPaths) {
      for (const file of commonFiles) {
        const fullPath = `${basePath}/${dir}${file}`.replace(/\/+/g, '/');
        try {
          const response = await fetch(fullPath, { method: 'HEAD' });
          if (response && response.ok) {
            files.push({
              path: fullPath,
              name: file,
              category: dir ? dir.replace('/', '') : 'root',
            });
          }
        } catch {
          // File doesn't exist, continue
        }
      }
    }

    return files;
  }

  /**
   * Processes a single file to extract metadata and content
   */
  private async processFile(file: FileInfo): Promise<Document | null> {
    try {
      const response = await fetch(file.path);
      if (!response || !response.ok) return null;

      const content = await response.text();
      const title = this.extractTitle(content, file.name);
      const category = this.extractCategory(file);
      const order = this.extractOrder(content, file.name);

      return {
        id: this.generateId(file.path),
        title,
        file: file.path,
        content,
        category: category !== 'root' ? category : undefined,
        order,
        tags: this.extractTags(content),
        description: this.extractDescription(content),
      };
    } catch (error) {
      console.warn(`Failed to process file ${file.path}:`, error);
      return null;
    }
  }

  /**
   * Extracts title from content based on strategy
   */
  private extractTitle(content: string, filename: string): string {
    switch (this.options.titleStrategy) {
      case 'heading': {
        const headingMatch = content.match(/^#\s+(.+)$/m);
        if (headingMatch) return headingMatch[1].trim();
        // Fallback to filename
        break;
      }

      case 'frontmatter': {
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
          const titleMatch = frontmatterMatch[1].match(/^title:\s*(.+)$/m);
          if (titleMatch) return titleMatch[1].trim().replace(/['"]/g, '');
        }
        // Fallback to heading then filename
        const fallbackHeading = content.match(/^#\s+(.+)$/m);
        if (fallbackHeading) return fallbackHeading[1].trim();
        break;
      }
    }

    // Default: convert filename to title
    return this.filenameToTitle(filename);
  }

  /**
   * Converts filename to human-readable title
   */
  private filenameToTitle(filename: string): string {
    return filename
      .replace(/\.md$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .replace(/^Readme$/i, 'Overview');
  }

  /**
   * Extracts category based on strategy
   */
  private extractCategory(file: FileInfo): string {
    switch (this.options.categoryStrategy) {
      case 'folder':
        return file.category || 'root';

      case 'frontmatter':
        // Would extract from frontmatter if available
        return file.category || 'root';

      case 'none':
      default:
        return 'root';
    }
  }

  /**
   * Extracts order from content or filename
   */
  private extractOrder(content: string, filename: string): number | undefined {
    // Check frontmatter for order
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const orderMatch = frontmatterMatch[1].match(/^order:\s*(\d+)$/m);
      if (orderMatch) return parseInt(orderMatch[1]);
    }

    // Check filename for numeric prefix
    const numericMatch = filename.match(/^(\d+)[-_.]/);
    if (numericMatch) return parseInt(numericMatch[1]);

    return undefined;
  }

  /**
   * Extracts tags from frontmatter
   */
  private extractTags(content: string): string[] | undefined {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const tagsMatch = frontmatterMatch[1].match(/^tags:\s*\[(.*?)\]$/m);
      if (tagsMatch) {
        return tagsMatch[1].split(',').map(tag => tag.trim().replace(/['"]/g, ''));
      }
    }
    return undefined;
  }

  /**
   * Extracts description from frontmatter or first paragraph
   */
  private extractDescription(content: string): string | undefined {
    // Try frontmatter first
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const descMatch = frontmatterMatch[1].match(/^description:\s*(.+)$/m);
      if (descMatch) return descMatch[1].trim().replace(/['"]/g, '');
    }

    // Extract first paragraph after title
    const contentAfterFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    const contentAfterTitle = contentAfterFrontmatter.replace(/^#.*\n/, '');
    const firstPara = contentAfterTitle.match(/^([^#\n].+?)(?:\n\n|\n#|$)/);
    if (firstPara) {
      return firstPara[1].trim().substring(0, 200) + (firstPara[1].length > 200 ? '...' : '');
    }

    return undefined;
  }

  /**
   * Generates unique ID from file path
   */
  private generateId(path: string): string {
    return path
      .replace(/^.*\//, '') // Remove directory
      .replace(/\.md$/, '') // Remove extension
      .replace(/[^a-z0-9]/gi, '-') // Replace non-alphanumeric with hyphens
      .toLowerCase();
  }

  /**
   * Sorts documents based on strategy
   */
  private sortDocuments(documents: Document[]): Document[] {
    switch (this.options.sortStrategy) {
      case 'alphabetical':
        return documents.sort((a, b) => {
          // Sort by order first, then by title
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.title.localeCompare(b.title);
        });

      case 'date':
        // Would sort by file modification date if available
        return documents;

      case 'custom':
        // Sort by explicit order, then alphabetical
        return documents.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return 0;
        });

      default:
        return documents;
    }
  }
}

/**
 * Quick helper function for zero-config setup
 */
export async function autoDiscoverDocs(basePath = './docs'): Promise<Document[]> {
  const discovery = new AutoDiscovery({ basePath });
  return discovery.discoverFiles();
}
