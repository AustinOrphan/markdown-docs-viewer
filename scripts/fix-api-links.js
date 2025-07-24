#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const apiDir = join(projectRoot, 'docs', 'api');

export async function fixApiLinks() {
  console.log('Fixing API documentation links...');

  const fixes = [];

  // Fix PersistentCache.md - TypeDoc generates links without parentheses for methods
  fixes.push({
    file: join(apiDir, 'classes', 'PersistentCache.md'),
    replacements: [
      // Methods need parentheses - use word boundaries to avoid partial matches
      { from: /LRUCache\.md#clear\b(?![\(\)])/g, to: 'LRUCache.md#clear()' },
      { from: /LRUCache\.md#delete\b(?![\(\)])/g, to: 'LRUCache.md#delete()' },
      { from: /LRUCache\.md#entries\b(?![\(\)])/g, to: 'LRUCache.md#entries()' },
      { from: /LRUCache\.md#getcapacity\b(?![\(\)])/g, to: 'LRUCache.md#getcapacity()' },
      { from: /LRUCache\.md#getmemoryusage\b(?![\(\)])/g, to: 'LRUCache.md#getmemoryusage()' },
      { from: /LRUCache\.md#get\b(?![\(\)])/g, to: 'LRUCache.md#get()' },
      { from: /LRUCache\.md#has\b(?![\(\)])/g, to: 'LRUCache.md#has()' },
      { from: /LRUCache\.md#set\b(?![\(\)])/g, to: 'LRUCache.md#set()' },
      { from: /LRUCache\.md#size\b(?![\(\)])/g, to: 'LRUCache.md#size()' },
    ],
  });

  // Fix AdvancedSearchOptions.md - optional properties need ? at the end
  fixes.push({
    file: join(apiDir, 'interfaces', 'AdvancedSearchOptions.md'),
    replacements: [
      // Fix optional properties (add ?)
      {
        from: /SearchOptions\.md#casesensitive\b(?!\?)(?!\)\))/g,
        to: 'SearchOptions.md#casesensitive?',
      },
      {
        from: /SearchOptions\.md#fuzzysearch\b(?!\?)(?!\)\))/g,
        to: 'SearchOptions.md#fuzzysearch?',
      },
      { from: /SearchOptions\.md#maxresults\b(?!\?)(?!\)\))/g, to: 'SearchOptions.md#maxresults?' },
      {
        from: /SearchOptions\.md#placeholder\b(?!\?)(?!\)\))/g,
        to: 'SearchOptions.md#placeholder?',
      },
      {
        from: /SearchOptions\.md#searchintags\b(?!\?)(?!\)\))/g,
        to: 'SearchOptions.md#searchintags?',
      },
    ],
  });

  // Fix ThemePreset.md - optional properties need ? at the end
  fixes.push({
    file: join(apiDir, 'interfaces', 'ThemePreset.md'),
    replacements: [
      // Fix optional properties (add ?)
      { from: /Theme\.md#allowcustomthemes\b(?!\?)(?!\)\))/g, to: 'Theme.md#allowcustomthemes?' },
      { from: /Theme\.md#compactdarktoggle\b(?!\?)(?!\)\))/g, to: 'Theme.md#compactdarktoggle?' },
      { from: /Theme\.md#customcss\b(?!\?)(?!\)\))/g, to: 'Theme.md#customcss?' },
      { from: /Theme\.md#darktoggleposition\b(?!\?)(?!\)\))/g, to: 'Theme.md#darktoggleposition?' },
      { from: /Theme\.md#enablepersistence\b(?!\?)(?!\)\))/g, to: 'Theme.md#enablepersistence?' },
      { from: /Theme\.md#showdarkmodelabel\b(?!\?)(?!\)\))/g, to: 'Theme.md#showdarkmodelabel?' },
      { from: /Theme\.md#showdescription\b(?!\?)(?!\)\))/g, to: 'Theme.md#showdescription?' },
      { from: /Theme\.md#showpreview\b(?!\?)(?!\)\))/g, to: 'Theme.md#showpreview?' },
      { from: /Theme\.md#storagekey\b(?!\?)(?!\)\))/g, to: 'Theme.md#storagekey?' },
      { from: /Theme\.md#switcherposition\b(?!\?)(?!\)\))/g, to: 'Theme.md#switcherposition?' },
    ],
  });

  // Apply fixes
  for (const fix of fixes) {
    try {
      let content = await readFile(fix.file, 'utf-8');
      let modified = false;

      for (const replacement of fix.replacements) {
        const before = content;
        if (replacement.from instanceof RegExp) {
          content = content.replace(replacement.from, replacement.to);
        } else {
          content = content.replace(
            new RegExp(replacement.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            replacement.to
          );
        }
        if (content !== before) {
          modified = true;
        }
      }

      if (modified) {
        await writeFile(fix.file, content);
        console.log(`Fixed links in ${fix.file}`);
      }
    } catch (error) {
      console.error(`Error fixing ${fix.file}: ${error.message}`);
    }
  }

  console.log('API link fixes complete!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fixApiLinks().catch(console.error);
}
