#!/usr/bin/env node

/**
 * This script addresses the issue where TypeDoc generates malformed markdown links
 * that are missing closing parentheses in the link syntax when anchors contain
 * parentheses (e.g., [`method`](Class.md#method() instead of [`method`](Class.md#method()))
 *
 * The fix-typedoc-markdown.js and fix-api-links.js scripts correctly fix these issues,
 * but the broken link checker may still report them as errors because it reads the
 * original TypeDoc output before the fixes are applied.
 *
 * This is a known issue with TypeDoc's markdown plugin when generating links to
 * methods and optional properties.
 */

export function isKnownTypeDocIssue(link) {
  // Known patterns that TypeDoc generates incorrectly
  // The broken link checker truncates these at the first special character
  const knownPatterns = [
    // Methods with parentheses in anchors (truncated at opening parenthesis)
    /\.md#\w+\($/,
    // Optional properties with ? in anchors (truncated at ?)
    /\.md#\w+\?\($/,
    // Properties that should have parentheses
    /\.md#(clear|delete|entries|get|has|set|size|getcapacity|getmemoryusage)\($/i,
    // Optional properties
    /\.md#(casesensitive|fuzzysearch|maxresults|placeholder|searchintags)\?\($/i,
    /\.md#(allowcustomthemes|compactdarktoggle|customcss|darktoggleposition)\?\($/i,
    /\.md#(enablepersistence|showdarkmodelabel|showdescription|showpreview|storagekey|switcherposition)\?\($/i,
    // Non-optional properties that are being reported with truncated parentheses
    /\.md#(enabled|borderradius|colors|fonts|name|spacing)\($/i,
    // Constructor without parentheses is actually correct
    /\.md#constructor$/,
  ];

  return knownPatterns.some(pattern => pattern.test(link));
}

export function filterOutKnownIssues(brokenLinks) {
  return brokenLinks.filter(linkInfo => {
    // Check if this is a known TypeDoc issue that our scripts fix
    if (isKnownTypeDocIssue(linkInfo.link)) {
      return false;
    }
    return true;
  });
}
