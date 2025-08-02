/**
 * Shared utilities for Markdown Docs Viewer examples
 *
 * This file provides common utility functions used across example files
 * to reduce code duplication and maintain consistency.
 */

(function () {
  'use strict';

  // Create namespace for example utilities
  window.ExampleUtils = window.ExampleUtils || {};

  /**
   * Escapes HTML special characters to prevent XSS attacks
   *
   * @param {string|null|undefined} text - Text to escape
   * @returns {string} HTML-escaped text
   */
  window.ExampleUtils.escapeHtml = function (text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Shows a status message in a specific element
   *
   * @param {string} elementId - ID of the status element
   * @param {string} type - Status type (success, error, warning, info)
   * @param {string} message - Message to display
   */
  window.ExampleUtils.showStatus = function (elementId, type, message) {
    const statusEl = document.getElementById(elementId);
    if (statusEl) {
      statusEl.className = `status ${type}`;
      statusEl.textContent = message;
      statusEl.style.display = 'block';
    }
  };

  /**
   * Creates triple backticks constant to avoid template literal parsing issues
   */
  window.ExampleUtils.TRIPLE_BACKTICK = String.fromCharCode(96, 96, 96);
})();
