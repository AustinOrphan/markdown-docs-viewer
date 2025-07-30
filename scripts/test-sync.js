#!/usr/bin/env node

/**
 * Test script to demonstrate the task progress sync functionality
 *
 * Usage: node scripts/test-sync.js
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const JSON_FILE = path.join(PROJECT_ROOT, 'task-progress.json');

function updateTaskStatus(taskId, newStatus, notes = '') {
  try {
    // Read current JSON
    const jsonData = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));

    // Find and update the task
    const task = jsonData.tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`❌ Task ${taskId} not found`);
      return false;
    }

    const oldStatus = task.status;
    task.status = newStatus;
    task.lastUpdated = new Date().toISOString();

    if (notes) {
      task.notes = notes;
    }

    // Update meta information
    jsonData.meta.lastUpdated = new Date().toISOString();

    // Update completedTasks count
    jsonData.meta.completedTasks = jsonData.tasks.filter(t => t.status === 'completed').length;

    // Update next task if this was the next task and it's completed
    if (taskId === jsonData.meta.nextTask && newStatus === 'completed') {
      const nextPendingTask = jsonData.tasks.find(t => t.status === 'pending');
      jsonData.meta.nextTask = nextPendingTask ? nextPendingTask.id : '';
    }

    // Add to progress log
    jsonData.progressLog.push({
      timestamp: new Date().toISOString(),
      event: 'task-status-updated',
      description: `Task ${taskId} changed from ${oldStatus} to ${newStatus}${notes ? ` (${notes})` : ''}`,
    });

    // Write updated JSON
    fs.writeFileSync(JSON_FILE, JSON.stringify(jsonData, null, 2));

    console.log(`✅ Updated task ${taskId}: ${oldStatus} → ${newStatus}`);
    console.log(`💡 Run 'npm run sync-tasks' to sync with markdown file`);

    return true;
  } catch (error) {
    console.error('❌ Failed to update task:', error.message);
    return false;
  }
}

// Demo functions
function runDemo() {
  console.log('🧪 Task Progress Sync Demo\n');

  console.log('1. Mark zero-config-1a as in-progress...');
  updateTaskStatus('zero-config-1a', 'in-progress', 'Started running npm run test:ci locally');

  setTimeout(() => {
    console.log('\n2. Mark zero-config-1a as completed...');
    updateTaskStatus(
      'zero-config-1a',
      'completed',
      'Captured CI errors - zero-config tests failing with unhandled promise rejections'
    );

    setTimeout(() => {
      console.log('\n3. Mark zero-config-1b as in-progress...');
      updateTaskStatus('zero-config-1b', 'in-progress', 'Analyzing test failure patterns');

      console.log('\n📋 Demo complete! Check task-progress.json for changes.');
      console.log('🔄 Run: npm run sync-tasks');
      console.log('👀 Or run: npm run sync-tasks:watch');
    }, 1000);
  }, 1000);
}

// CLI interface
const command = process.argv[2];

if (command === 'demo') {
  runDemo();
} else if (command && command.startsWith('complete:')) {
  const taskId = command.split(':')[1];
  const notes = process.argv[3] || '';
  updateTaskStatus(taskId, 'completed', notes);
} else if (command && command.startsWith('start:')) {
  const taskId = command.split(':')[1];
  const notes = process.argv[3] || '';
  updateTaskStatus(taskId, 'in-progress', notes);
} else {
  console.log('🧪 Task Progress Test Script\n');
  console.log('Usage:');
  console.log('  node scripts/test-sync.js demo                    # Run demo');
  console.log('  node scripts/test-sync.js start:zero-config-1a   # Mark task as in-progress');
  console.log(
    '  node scripts/test-sync.js complete:zero-config-1a "Notes here"  # Mark task as completed'
  );
  console.log('\nAfter making changes, run:');
  console.log('  npm run sync-tasks                               # Sync once');
  console.log('  npm run sync-tasks:watch                         # Watch for changes');
}
