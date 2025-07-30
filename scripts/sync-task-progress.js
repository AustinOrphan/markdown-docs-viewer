#!/usr/bin/env node

/**
 * Task Progress Sync Script
 *
 * Automatically syncs changes between task-progress.json and TASK-PROGRESS.md
 * Runs via file watcher or can be called manually
 *
 * Usage:
 *   node scripts/sync-task-progress.js [--watch] [--json-to-md] [--md-to-json]
 */

import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const JSON_FILE = path.join(PROJECT_ROOT, 'task-progress.json');
const MD_FILE = path.join(PROJECT_ROOT, 'TASK-PROGRESS.md');

// File locking constants
const LOCK_TIMEOUT_MS = 30000; // 30 seconds
const RETRY_ATTEMPTS = 5;
const BASE_RETRY_DELAY = 100; // milliseconds

/**
 * FileLock class for managing concurrent access to files
 */
class FileLock {
  constructor(filePath) {
    this.filePath = filePath;
    this.lockPath = `${filePath}.lock.${process.pid}`;
    this.lockHandle = null;
  }

  /**
   * Acquire exclusive lock on file with timeout
   */
  async acquire() {
    const startTime = Date.now();
    let attempts = 0;

    while (attempts < RETRY_ATTEMPTS) {
      try {
        // Clean up any orphaned locks first
        await this.cleanupOrphanedLocks();

        // Try to create lock file exclusively
        this.lockHandle = await fs.promises.open(this.lockPath, 'wx');

        // Write process info to lock file
        await this.lockHandle.writeFile(
          JSON.stringify({
            pid: process.pid,
            timestamp: new Date().toISOString(),
            filePath: this.filePath,
          })
        );

        return true;
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Lock exists, check if it's expired or orphaned
          const lockExpired = await this.isLockExpired();
          if (lockExpired) {
            await this.cleanupOrphanedLocks();
            attempts++; // Try again
            continue;
          }

          // Check timeout
          if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
            throw new Error(
              `Lock acquisition timeout after ${LOCK_TIMEOUT_MS}ms for ${this.filePath}`
            );
          }

          // Wait with exponential backoff and jitter
          const delay = BASE_RETRY_DELAY * Math.pow(2, attempts) + Math.random() * 50;
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Failed to acquire lock after ${RETRY_ATTEMPTS} attempts for ${this.filePath}`);
  }

  /**
   * Release the lock
   */
  async release() {
    if (this.lockHandle) {
      try {
        await this.lockHandle.close();
        await fs.promises.unlink(this.lockPath);
      } catch (error) {
        console.warn(`Warning: Failed to clean up lock file ${this.lockPath}:`, error.message);
      }
      this.lockHandle = null;
    }
  }

  /**
   * Check if lock is expired or process no longer exists
   */
  async isLockExpired() {
    try {
      const lockData = await fs.promises.readFile(this.lockPath, 'utf8');
      const lockInfo = JSON.parse(lockData);
      const lockAge = Date.now() - new Date(lockInfo.timestamp).getTime();

      // Check if lock is too old
      if (lockAge > LOCK_TIMEOUT_MS) {
        return true;
      }

      // Check if process still exists (Unix only)
      if (process.platform !== 'win32') {
        try {
          process.kill(lockInfo.pid, 0); // Signal 0 just checks if process exists
          return false; // Process exists, lock is valid
        } catch (error) {
          return true; // Process doesn't exist, lock is orphaned
        }
      }

      return false;
    } catch (error) {
      return true; // Can't read lock, assume it's orphaned
    }
  }

  /**
   * Clean up orphaned or expired lock files
   */
  async cleanupOrphanedLocks() {
    try {
      const lockDir = path.dirname(this.filePath);
      const lockBasename = path.basename(this.filePath) + '.lock.';
      const files = await fs.promises.readdir(lockDir);

      for (const file of files) {
        if (file.startsWith(lockBasename)) {
          const lockFile = path.join(lockDir, file);
          const lockData = await fs.promises.readFile(lockFile, 'utf8').catch(() => null);

          if (lockData) {
            try {
              const lockInfo = JSON.parse(lockData);
              const lockAge = Date.now() - new Date(lockInfo.timestamp).getTime();

              // Remove if expired or process doesn't exist
              if (
                lockAge > LOCK_TIMEOUT_MS ||
                (process.platform !== 'win32' && !this.processExists(lockInfo.pid))
              ) {
                await fs.promises.unlink(lockFile);
                console.log(`🧹 Cleaned up orphaned lock: ${file}`);
              }
            } catch (parseError) {
              // Invalid lock file, remove it
              await fs.promises.unlink(lockFile);
              console.log(`🧹 Cleaned up invalid lock: ${file}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Warning: Failed to cleanup orphaned locks:', error.message);
    }
  }

  /**
   * Check if process exists (Unix only)
   */
  processExists(pid) {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return false;
    }
  }
}

class TaskProgressSync {
  constructor() {
    this.lastSyncTime = new Date().toISOString();
  }

  /**
   * Atomic update operation with file locking
   */
  async atomicUpdate(updateFn) {
    const lock = new FileLock(JSON_FILE);
    try {
      await lock.acquire();

      // Read current data
      const data = await fs.promises.readFile(JSON_FILE, 'utf8');
      const jsonData = JSON.parse(data);

      // Validate structure before modifications
      this.validateJsonStructure(jsonData);

      // Apply update function
      const updatedData = await updateFn(jsonData);

      // Validate structure after modifications
      this.validateJsonStructure(updatedData);

      // Write to temporary file first
      const tempFile = JSON_FILE + '.tmp';
      await fs.promises.writeFile(tempFile, JSON.stringify(updatedData, null, 2));

      // Atomic rename to replace original
      await fs.promises.rename(tempFile, JSON_FILE);

      return updatedData;
    } finally {
      await lock.release();
    }
  }

  /**
   * Update task status with concurrent safety
   */
  async updateTaskStatus(taskId, status, notes = '') {
    return await this.atomicUpdate(async jsonData => {
      const task = jsonData.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Update task
      task.status = status;
      task.lastUpdated = new Date().toISOString();
      if (notes) {
        task.notes = notes;
      }

      // Update meta information
      jsonData.meta.lastUpdated = new Date().toISOString();
      jsonData.meta.lastSynced = this.lastSyncTime;

      // Recalculate statistics
      this.recalculateMetaStats(jsonData);

      // Add progress log entry
      jsonData.progressLog.push({
        timestamp: new Date().toISOString(),
        event: 'task-status-updated',
        description: `Updated ${taskId} status to ${status}${notes ? ': ' + notes : ''}`,
      });

      console.log(`✅ Updated task ${taskId} status to ${status}`);
      return jsonData;
    });
  }

  /**
   * Mark task as completed with concurrent safety
   */
  async completeTask(taskId, completedAt = new Date().toISOString(), notes = '') {
    return await this.atomicUpdate(async jsonData => {
      const task = jsonData.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Update task
      task.status = 'completed';
      task.completedAt = completedAt;
      task.lastUpdated = new Date().toISOString();
      if (notes) {
        task.notes = notes;
      }

      // Update meta information
      jsonData.meta.lastUpdated = new Date().toISOString();
      jsonData.meta.lastSynced = this.lastSyncTime;

      // Recalculate statistics
      this.recalculateMetaStats(jsonData);

      // Update next task if this was the current next task
      if (jsonData.meta.nextTask === taskId) {
        jsonData.meta.nextTask = this.findNextTask(jsonData);
      }

      // Add progress log entry
      jsonData.progressLog.push({
        timestamp: new Date().toISOString(),
        event: 'task-completed',
        description: `Completed ${taskId}${notes ? ': ' + notes : ''}`,
      });

      console.log(`🎉 Completed task ${taskId}`);
      return jsonData;
    });
  }

  /**
   * Start task (mark as in-progress) with concurrent safety
   */
  async startTask(taskId, startedAt = new Date().toISOString()) {
    return await this.atomicUpdate(async jsonData => {
      const task = jsonData.tasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      // Update task
      task.status = 'in-progress';
      task.startedAt = startedAt;
      task.lastUpdated = new Date().toISOString();

      // Update meta information
      jsonData.meta.lastUpdated = new Date().toISOString();
      jsonData.meta.lastSynced = this.lastSyncTime;
      jsonData.meta.nextTask = taskId;

      // Recalculate statistics
      this.recalculateMetaStats(jsonData);

      // Add progress log entry
      jsonData.progressLog.push({
        timestamp: new Date().toISOString(),
        event: 'task-started',
        description: `Started working on ${taskId}`,
      });

      console.log(`🚀 Started task ${taskId}`);
      return jsonData;
    });
  }

  /**
   * Update meta information with concurrent safety
   */
  async updateMeta(updates) {
    return await this.atomicUpdate(async jsonData => {
      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates must be an object');
      }

      // Apply updates to meta
      Object.assign(jsonData.meta, updates);
      jsonData.meta.lastUpdated = new Date().toISOString();
      jsonData.meta.lastSynced = this.lastSyncTime;

      console.log(`📊 Updated meta information:`, Object.keys(updates));
      return jsonData;
    });
  }

  /**
   * Recalculate meta statistics based on current task states
   */
  recalculateMetaStats(jsonData) {
    const completedTasks = jsonData.tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = jsonData.tasks.filter(task => task.status === 'in-progress').length;

    jsonData.meta.completedTasks = completedTasks;
    jsonData.meta.totalTasks = jsonData.tasks.length;

    // Update phase completion stats
    jsonData.phases.forEach(phase => {
      const phaseTasks = jsonData.tasks.filter(task => task.phase === phase.id);
      phase.completedTasks = phaseTasks.filter(task => task.status === 'completed').length;
      phase.totalTasks = phaseTasks.length;

      // Update phase status based on task completion
      if (phase.completedTasks === 0) {
        phase.status = phase.status === 'in-progress' ? 'in-progress' : 'waiting';
      } else if (phase.completedTasks === phase.totalTasks) {
        phase.status = 'completed';
      } else {
        phase.status = 'in-progress';
      }
    });

    // Estimate remaining time (simple calculation)
    const remainingTasks = jsonData.meta.totalTasks - completedTasks;
    const avgTimePerTask = 8; // minutes, rough estimate
    const minTime = Math.max(0, remainingTasks * 5);
    const maxTime = Math.max(0, remainingTasks * avgTimePerTask);
    jsonData.meta.estimatedTimeRemaining = `${minTime}-${maxTime} minutes`;
  }

  /**
   * Find the next task to work on based on dependencies and priority
   */
  findNextTask(jsonData) {
    // Find highest priority pending tasks with satisfied dependencies
    const pendingTasks = jsonData.tasks.filter(
      task => task.status === 'pending' || task.status === 'waiting'
    );

    for (const task of pendingTasks) {
      // Check if all dependencies are completed
      const dependenciesSatisfied = task.dependencies.every(depId => {
        const depTask = jsonData.tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });

      if (dependenciesSatisfied) {
        return task.id;
      }
    }

    return null; // No available tasks
  }

  /**
   * Execute multiple operations atomically to reduce lock contention
   */
  async batchUpdate(operations) {
    if (!Array.isArray(operations) || operations.length === 0) {
      throw new Error('Operations must be a non-empty array');
    }

    return await this.atomicUpdate(async jsonData => {
      let hasChanges = false;

      for (const operation of operations) {
        const { type, taskId, ...params } = operation;

        switch (type) {
          case 'updateStatus':
            const task = jsonData.tasks.find(t => t.id === taskId);
            if (task) {
              task.status = params.status;
              task.lastUpdated = new Date().toISOString();
              if (params.notes) task.notes = params.notes;
              hasChanges = true;
            }
            break;

          case 'completeTask':
            const completeTask = jsonData.tasks.find(t => t.id === taskId);
            if (completeTask) {
              completeTask.status = 'completed';
              completeTask.completedAt = params.completedAt || new Date().toISOString();
              completeTask.lastUpdated = new Date().toISOString();
              if (params.notes) completeTask.notes = params.notes;
              hasChanges = true;
            }
            break;

          case 'startTask':
            const startTask = jsonData.tasks.find(t => t.id === taskId);
            if (startTask) {
              startTask.status = 'in-progress';
              startTask.startedAt = params.startedAt || new Date().toISOString();
              startTask.lastUpdated = new Date().toISOString();
              hasChanges = true;
            }
            break;

          case 'updateMeta':
            Object.assign(jsonData.meta, params);
            hasChanges = true;
            break;

          default:
            throw new Error(`Unknown batch operation type: ${type}`);
        }
      }

      if (hasChanges) {
        // Update global meta information
        jsonData.meta.lastUpdated = new Date().toISOString();
        jsonData.meta.lastSynced = this.lastSyncTime;

        // Recalculate statistics
        this.recalculateMetaStats(jsonData);

        // Add batch progress log entry
        jsonData.progressLog.push({
          timestamp: new Date().toISOString(),
          event: 'batch-update',
          description: `Executed ${operations.length} operations atomically`,
        });

        console.log(`🚀 Batch update completed: ${operations.length} operations`);
      }

      return jsonData;
    });
  }

  /**
   * Main sync function - determines direction and syncs files
   */
  async sync() {
    try {
      if (!fs.existsSync(JSON_FILE) || !fs.existsSync(MD_FILE)) {
        console.error('❌ Both task-progress.json and TASK-PROGRESS.md must exist');
        return false;
      }

      const jsonStats = fs.statSync(JSON_FILE);
      const mdStats = fs.statSync(MD_FILE);

      // Determine which file was modified more recently
      if (jsonStats.mtime > mdStats.mtime) {
        console.log('🔄 JSON is newer - syncing JSON → MD');
        await this.syncJsonToMd();
      } else if (mdStats.mtime > jsonStats.mtime) {
        console.log('🔄 MD is newer - syncing MD → JSON');
        await this.syncMdToJson();
      } else {
        console.log('✅ Files are in sync');
      }

      return true;
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
      return false;
    }
  }

  /**
   * Validate JSON structure to prevent runtime crashes
   */
  validateJsonStructure(jsonData) {
    if (!jsonData || typeof jsonData !== 'object') {
      throw new Error('Invalid JSON: Data must be an object');
    }

    if (!jsonData.meta || typeof jsonData.meta !== 'object') {
      throw new Error('Invalid JSON: Missing or invalid meta object');
    }

    if (!Array.isArray(jsonData.tasks)) {
      throw new Error('Invalid JSON: tasks must be an array');
    }

    if (!Array.isArray(jsonData.phases)) {
      throw new Error('Invalid JSON: phases must be an array');
    }

    if (!Array.isArray(jsonData.progressLog)) {
      throw new Error('Invalid JSON: progressLog must be an array');
    }

    // Validate required meta fields
    const requiredMetaFields = ['lastUpdated', 'currentPhase', 'nextTask', 'totalTasks'];
    for (const field of requiredMetaFields) {
      if (!(field in jsonData.meta)) {
        throw new Error(`Invalid JSON: meta.${field} is required`);
      }
    }
  }

  /**
   * Sync changes from JSON to Markdown
   */
  async syncJsonToMd() {
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

    // Validate JSON structure before processing
    this.validateJsonStructure(jsonData);

    let mdContent = fs.readFileSync(MD_FILE, 'utf8');

    // Update sync timestamp in JSON
    jsonData.meta.lastSynced = this.lastSyncTime;
    jsonData.meta.lastUpdated = new Date().toISOString();

    // Update header metadata
    mdContent = this.updateMdHeader(mdContent, jsonData.meta);

    // Update executive dashboard
    mdContent = this.updateExecutiveDashboard(mdContent, jsonData);

    // Update phase status
    mdContent = this.updatePhaseStatus(mdContent, jsonData);

    // Update detailed task status
    mdContent = this.updateDetailedTaskStatus(mdContent, jsonData);

    // Update progress notes
    mdContent = this.updateProgressNotes(mdContent, jsonData);

    // Write updated MD file
    fs.writeFileSync(MD_FILE, mdContent);

    // Write updated JSON with sync timestamp
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));

    console.log(`✅ Synced JSON → MD (${Object.keys(jsonData.tasks).length} tasks)`);
  }

  /**
   * Sync changes from Markdown to JSON (basic implementation)
   */
  async syncMdToJson() {
    // For now, this is a placeholder - MD → JSON parsing is more complex
    // In practice, JSON should be the source of truth for programmatic updates
    console.log('⚠️  MD → JSON sync not fully implemented - JSON is source of truth');
    console.log('💡 Update the JSON file directly for programmatic changes');
  }

  /**
   * Update markdown header with metadata
   */
  updateMdHeader(mdContent, meta) {
    const headerRegex =
      /^(# PR #48 Task Progress Tracker\n\n)\*\*Last Updated\*\*:.*?\n\*\*Current Phase\*\*:.*?\n\*\*Next Task\*\*:.*?\n/m;

    const newHeader = `# PR #48 Task Progress Tracker

**Last Updated**: ${meta.lastUpdated.split('T')[0]} ${meta.lastUpdated.split('T')[1].split('.')[0]}  
**Current Phase**: ${meta.currentPhase}  
**Next Task**: \`${meta.nextTask}\`
**Last Synced**: ${meta.lastSynced ? meta.lastSynced.split('T')[0] + ' ' + meta.lastSynced.split('T')[1].split('.')[0] : 'Never'}

`;

    return mdContent.replace(headerRegex, newHeader);
  }

  /**
   * Update executive dashboard section
   */
  updateExecutiveDashboard(mdContent, jsonData) {
    const dashboardRegex =
      /## Executive Dashboard\n\n\| Metric \| Value \|\n\|--------\|-------\|\n[\s\S]*?\n\n## Phase Status/m;

    const completedTasks = jsonData.tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = jsonData.tasks.filter(task => task.status === 'in-progress').length;
    const completionPercentage = Math.round((completedTasks / jsonData.meta.totalTasks) * 100);

    const newDashboard = `## Executive Dashboard

| Metric | Value |
|--------|-------|
| **Total Tasks** | ${jsonData.meta.totalTasks} atomic tasks |
| **Completed** | ${completedTasks} / ${jsonData.meta.totalTasks} (${completionPercentage}%) |
| **In Progress** | ${inProgressTasks} |
| **Remaining** | ${jsonData.meta.totalTasks - completedTasks} |
| **Estimated Time Remaining** | ${jsonData.meta.estimatedTimeRemaining} |
| **Current Phase** | ${jsonData.meta.currentPhase} |

## Phase Status`;

    return mdContent.replace(dashboardRegex, newDashboard);
  }

  /**
   * Update phase status section
   */
  updatePhaseStatus(mdContent, jsonData) {
    const phaseRegex = /### 🎯 Phase \d+:.*?(?=### 🎯 Phase \d+:|## Detailed Task Status)/gs;

    let newPhaseSection = '';

    jsonData.phases.forEach((phase, index) => {
      const phaseNumber = index + 1;
      const phaseTasks = jsonData.tasks.filter(task => task.phase === phase.id);
      const completedInPhase = phaseTasks.filter(task => task.status === 'completed').length;
      const statusIcon = this.getPhaseStatusIcon(phase.status);

      newPhaseSection += `### 🎯 Phase ${phaseNumber}: ${phase.name} (${completedInPhase}/${phase.totalTasks} completed)\n`;
      newPhaseSection += `**Status**: ${statusIcon} ${this.capitalizeFirst(phase.status)}  \n`;
      newPhaseSection += `**Estimated Time**: ${phase.estimatedTime}  \n`;

      if (phase.blocking) {
        newPhaseSection += `**Blocking**: ${phase.blocking}  \n`;
      }
      if (phase.dependsOn && phase.dependsOn.length > 0) {
        newPhaseSection += `**Depends On**: ${phase.dependsOn.join(', ')}  \n`;
      }

      newPhaseSection += '\n';

      // Add tasks for this phase
      phaseTasks.forEach(task => {
        const statusIcon = this.getTaskStatusIcon(task.status);
        const isNext = task.id === jsonData.meta.nextTask;
        const taskLine = isNext
          ? `- ${statusIcon} \`${task.id}\` - ${task.description} **← NEXT**`
          : `- ${statusIcon} \`${task.id}\` - ${task.description}`;
        newPhaseSection += taskLine + '\n';
      });

      newPhaseSection += '\n';
    });

    // Replace all phase sections
    return mdContent.replace(
      /### 🎯 Phase \d+:[\s\S]*?(?=## Detailed Task Status)/m,
      newPhaseSection
    );
  }

  /**
   * Update detailed task status table
   */
  updateDetailedTaskStatus(mdContent, jsonData) {
    const taskTableRegex =
      /## Detailed Task Status\n\n### 🚨 HIGH PRIORITY TASKS[\s\S]*?(?=## Task Status Legend)/m;

    let newTaskSection = '## Detailed Task Status\n\n### 🚨 HIGH PRIORITY TASKS\n\n';

    // Group tasks by stream
    const streams = [...new Set(jsonData.tasks.map(task => task.stream))];

    streams.forEach(stream => {
      const streamTasks = jsonData.tasks.filter(task => task.stream === stream);
      const completedInStream = streamTasks.filter(task => task.status === 'completed').length;
      const streamPriority = streamTasks[0]?.priority || 'medium';

      if (streamPriority === 'high') {
        newTaskSection += `#### ${this.capitalizeFirst(stream)} Stream (${completedInStream}/${streamTasks.length} completed)\n`;
        newTaskSection += '| Task ID | Description | Status | Phase | Dependencies | Est. Time |\n';
        newTaskSection += '|---------|-------------|--------|-------|--------------|-----------|\n';

        streamTasks.forEach(task => {
          const statusIcon = this.getTaskStatusIcon(task.status);
          const statusText =
            task.id === jsonData.meta.nextTask
              ? '⏳ **NEXT**'
              : `${statusIcon} ${this.capitalizeFirst(task.status)}`;
          const deps = task.dependencies.length > 0 ? task.dependencies.join(',') : 'None';

          newTaskSection += `| \`${task.id}\` | ${task.description} | ${statusText} | ${task.phase} | ${deps} | ${task.estimatedTime} |\n`;
        });

        newTaskSection += '\n';
      }
    });

    newTaskSection += '### 🔶 MEDIUM PRIORITY TASKS\n\n';

    // Add medium priority streams
    streams.forEach(stream => {
      const streamTasks = jsonData.tasks.filter(task => task.stream === stream);
      const completedInStream = streamTasks.filter(task => task.status === 'completed').length;
      const streamPriority = streamTasks[0]?.priority || 'medium';

      if (streamPriority === 'medium') {
        newTaskSection += `#### ${this.capitalizeFirst(stream)} Stream (${completedInStream}/${streamTasks.length} completed)\n`;
        newTaskSection += '| Task ID | Description | Status | Phase | Dependencies | Est. Time |\n';
        newTaskSection += '|---------|-------------|--------|-------|--------------|-----------|\n';

        streamTasks.forEach(task => {
          const statusIcon = this.getTaskStatusIcon(task.status);
          const statusText = `${statusIcon} ${this.capitalizeFirst(task.status)}`;
          const deps = task.dependencies.length > 0 ? task.dependencies.join(',') : 'None';

          newTaskSection += `| \`${task.id}\` | ${task.description} | ${statusText} | ${task.phase} | ${deps} | ${task.estimatedTime} |\n`;
        });

        newTaskSection += '\n';
      }
    });

    return mdContent.replace(taskTableRegex, newTaskSection);
  }

  /**
   * Update progress notes section
   */
  updateProgressNotes(mdContent, jsonData) {
    const notesRegex = /(## Progress Notes\n\n### Session Log\n)([\s\S]*?)(\n### Key Decisions)/m;

    let sessionLog = '';
    jsonData.progressLog.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      const time = entry.timestamp.split('T')[1].split('.')[0];
      sessionLog += `- **${date} ${time}**: ${entry.description}\n`;
    });

    const replacement = `$1${sessionLog}$3`;
    return mdContent.replace(notesRegex, replacement);
  }

  /**
   * Utility functions
   */
  getPhaseStatusIcon(status) {
    const icons = {
      'not-started': '⏸️',
      'in-progress': '🔄',
      completed: '✅',
      waiting: '⏳',
      blocked: '❌',
    };
    return icons[status] || '❓';
  }

  getTaskStatusIcon(status) {
    const icons = {
      next: '⏳',
      'in-progress': '🔄',
      completed: '✅',
      pending: '⏸️',
      blocked: '❌',
      'needs-review': '⚠️',
    };
    return icons[status] || '❓';
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
  }

  /**
   * Start file watcher
   */
  startWatcher() {
    console.log('👀 Watching for changes to task progress files...');

    const watcher = chokidar.watch([JSON_FILE, MD_FILE], {
      ignored: /^\./,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async filePath => {
      console.log(`📝 File changed: ${path.basename(filePath)}`);

      // Small delay to ensure file write is complete
      setTimeout(async () => {
        await this.sync();
      }, 100);
    });

    watcher.on('error', error => {
      console.error('👀 Watcher error:', error);
    });

    return watcher;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const syncer = new TaskProgressSync();

  if (args.includes('--watch')) {
    syncer.startWatcher();

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping task progress sync...');
      process.exit(0);
    });

    // Perform initial sync
    await syncer.sync();
  } else if (args.includes('--json-to-md')) {
    await syncer.syncJsonToMd();
  } else if (args.includes('--md-to-json')) {
    await syncer.syncMdToJson();
  } else {
    // Auto-detect and sync
    await syncer.sync();
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  main().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

export default TaskProgressSync;
