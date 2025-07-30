import { Document, NavigationOptions } from './types';

import { escapeHtml } from './utils';

export function createNavigation(
  documents: Document[],
  currentDoc: Document | null,
  options: NavigationOptions
): string {
  // Group documents by category if enabled
  const grouped = options.showCategories
    ? groupByCategory(documents)
    : { 'All Documents': documents };

  // Sort documents
  const sortedGroups = Object.entries(grouped).map(([category, docs]) => ({
    category,
    documents: sortDocuments(docs, options.sortBy || 'order'),
  }));

  return `
    <nav class="mdv-navigation" role="navigation" aria-label="Documentation navigation">
      <ul class="mdv-nav-list" role="list">
        ${sortedGroups.map(group => renderGroup(group, currentDoc, options)).join('')}
      </ul>
    </nav>
  `;
}

function groupByCategory(documents: Document[]): Record<string, Document[]> {
  return documents.reduce(
    (acc, doc) => {
      const category = doc.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, Document[]>
  );
}

function sortDocuments(documents: Document[], sortBy: string): Document[] {
  return [...documents].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'order':
        return (a.order || 999) - (b.order || 999);
      default:
        return 0;
    }
  });
}

function renderGroup(
  group: { category: string; documents: Document[] },
  currentDoc: Document | null,
  options: NavigationOptions
): string {
  const isCollapsible = options.collapsible && group.documents.length > 1;
  const categoryId = `mdv-category-${group.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  return `
    <li class="mdv-nav-group" role="listitem">
      ${
        group.category !== 'All Documents'
          ? `
        ${
          isCollapsible
            ? `
          <button class="mdv-nav-category collapsible"
                  type="button"
                  aria-expanded="false"
                  aria-controls="${categoryId}">
${escapeHtml(group.category)}
            <span class="mdv-collapse-icon" aria-hidden="true">▶</span>
          </button>
        `
            : `
          <div class="mdv-nav-category">
${escapeHtml(group.category)}
          </div>
        `
        }
      `
          : ''
      }
      <ul class="mdv-nav-sublist" role="list" ${isCollapsible ? `id="${categoryId}" hidden` : ''}>
        ${group.documents.map(doc => renderDocument(doc, currentDoc, options)).join('')}
      </ul>
    </li>
  `;
}

function renderDocument(
  doc: Document,
  currentDoc: Document | null,
  options: NavigationOptions
): string {
  const isActive = currentDoc?.id === doc.id;
  const tags = options.showTags && doc.tags ? renderTags(doc.tags) : '';
  const description =
    options.showDescription && doc.description
      ? `<div class="mdv-nav-description">${escapeHtml(doc.description)}</div>`
      : '';

  return `
    <li class="mdv-nav-item" role="listitem">
      <a href="#${escapeHtml(doc.id)}" 
         class="mdv-nav-link ${isActive ? 'active' : ''}"
         data-doc-id="${escapeHtml(doc.id)}"
         aria-current="${isActive ? 'page' : 'false'}"
         role="link">
        <span class="mdv-nav-title">${escapeHtml(doc.title)}</span>
        ${description}
        ${tags}
      </a>
    </li>
  `;
}

function renderTags(tags: string[]): string {
  return `
    <div class="mdv-nav-tags">
      ${tags.map(tag => `<span class="mdv-tag">${escapeHtml(tag)}</span>`).join('')}
    </div>
  `;
}
