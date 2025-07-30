#!/usr/bin/env node

/**
 * Verification script for XSS prevention - tests script tag escaping
 */

// Load the escapeHtml function
import { escapeHtml } from './src/utils.js';

console.log('🔒 XSS Prevention Verification - Script Tag Escaping');
console.log('================================================\n');

// Test cases for script tag escaping
const testCases = [
  {
    name: 'Basic script tag',
    input: '<script>alert("XSS")</script>',
    expectedOutput: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
  },
  {
    name: 'Script with single quotes',
    input: "<script>alert('XSS')</script>",
    expectedOutput: '&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;',
  },
  {
    name: 'Complex script injection',
    input: '"><script>document.cookie="stolen"</script>',
    expectedOutput: '&quot;&gt;&lt;script&gt;document.cookie=&quot;stolen&quot;&lt;/script&gt;',
  },
  {
    name: 'Script with attributes',
    input: '<script type="text/javascript">alert("XSS")</script>',
    expectedOutput:
      '&lt;script type=&quot;text/javascript&quot;&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
  },
  {
    name: 'Multiple script tags',
    input: '<script>alert(1)</script><script>alert(2)</script>',
    expectedOutput: '&lt;script&gt;alert(1)&lt;/script&gt;&lt;script&gt;alert(2)&lt;/script&gt;',
  },
];

let allTestsPassed = true;

console.log('Testing escapeHtml function with script tag payloads:\n');

for (const testCase of testCases) {
  const result = escapeHtml(testCase.input);
  const passed = result === testCase.expectedOutput;

  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  console.log(`   Input:    ${testCase.input}`);
  console.log(`   Output:   ${result}`);
  console.log(`   Expected: ${testCase.expectedOutput}`);

  if (!passed) {
    allTestsPassed = false;
    console.log('   ❌ FAILED: Output does not match expected result');
  } else {
    console.log('   ✅ PASSED: Script tags properly escaped');
  }
  console.log('');
}

// Test that escaped content cannot execute
console.log('Testing that escaped content is safe:');
console.log('=====================================\n');

const dangerousScript = '<script>alert("This should not execute")</script>';
const escapedScript = escapeHtml(dangerousScript);

console.log(`Original dangerous script: ${dangerousScript}`);
console.log(`Escaped safe version:      ${escapedScript}`);
console.log('');

// Verify no script tags remain in escaped content
const hasScriptTag = escapedScript.includes('<script>') || escapedScript.includes('</script>');
console.log(
  `${hasScriptTag ? '❌' : '✅'} Escaped content contains no executable script tags: ${!hasScriptTag}`
);

// Verify all dangerous characters are escaped
const dangerousChars = ['<', '>', '"', "'"];
const allEscaped = dangerousChars.every(
  char => !escapedScript.includes(char) || escapedScript === ''
);

console.log(`${allEscaped ? '✅' : '❌'} All dangerous HTML characters are escaped: ${allEscaped}`);

console.log('\n🎯 Final Results:');
console.log('================');
console.log(
  `Overall test result: ${allTestsPassed && !hasScriptTag && allEscaped ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
);
console.log(`Script tag escaping: ${!hasScriptTag ? '✅ SECURE' : '❌ VULNERABLE'}`);
console.log(`HTML character escaping: ${allEscaped ? '✅ SECURE' : '❌ VULNERABLE'}`);

if (allTestsPassed && !hasScriptTag && allEscaped) {
  console.log('\n🎉 XSS Prevention is working correctly!');
  console.log('   Script tags are properly escaped and cannot execute.');
  process.exit(0);
} else {
  console.log('\n⚠️  XSS Prevention has issues!');
  console.log('   Manual review required.');
  process.exit(1);
}
