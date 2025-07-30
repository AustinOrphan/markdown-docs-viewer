/**
 * Simple verification of script tag escaping without imports
 */

// Copy of escapeHtml function for testing
function escapeHtml(text) {
  if (text == null) return '';

  const str = String(text);
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return str.replace(/[&<>"']/g, m => map[m]);
}

console.log('🔒 XSS Prevention Verification - Script Tag Escaping');
console.log('================================================\n');

// Test script tag escaping
const testCases = [
  {
    name: 'Basic script tag',
    input: '<script>alert("XSS")</script>',
    expected: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
  },
  {
    name: 'Script with single quotes',
    input: "<script>alert('XSS')</script>",
    expected: '&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;',
  },
  {
    name: 'Complex XSS attempt',
    input: '"><script>document.cookie="stolen"</script>',
    expected: '&quot;&gt;&lt;script&gt;document.cookie=&quot;stolen&quot;&lt;/script&gt;',
  },
];

let allTestsPassed = true;

console.log('Testing script tag escaping:');
console.log('============================\n');

for (const testCase of testCases) {
  const result = escapeHtml(testCase.input);
  const passed = result === testCase.expected;

  console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
  console.log(`  Input:    ${testCase.input}`);
  console.log(`  Output:   ${result}`);
  console.log(`  Expected: ${testCase.expected}`);

  if (!passed) {
    allTestsPassed = false;
    console.log('  ❌ FAILED: Output does not match expected');
  } else {
    console.log('  ✅ PASSED: Script tags properly escaped');
  }
  console.log('');
}

// Verify no executable script tags remain
console.log('Security verification:');
console.log('=====================\n');

const dangerousScript = '<script>alert("This would be dangerous")</script>';
const escapedScript = escapeHtml(dangerousScript);

console.log(`Original: ${dangerousScript}`);
console.log(`Escaped:  ${escapedScript}`);
console.log('');

// Check for any remaining script tags
const hasExecutableScript =
  escapedScript.includes('<script>') || escapedScript.includes('</script>');
const allDangerousCharsEscaped = !escapedScript.includes('<') && !escapedScript.includes('>');

console.log(
  `${hasExecutableScript ? '❌' : '✅'} No executable script tags: ${!hasExecutableScript}`
);
console.log(
  `${allDangerousCharsEscaped ? '✅' : '❌'} All < and > characters escaped: ${allDangerousCharsEscaped}`
);

console.log('\n🎯 Final Result:');
console.log('================');
if (allTestsPassed && !hasExecutableScript && allDangerousCharsEscaped) {
  console.log('✅ ALL TESTS PASSED - XSS Prevention Working');
  console.log('   Script tags are properly escaped and cannot execute');
} else {
  console.log('❌ SOME TESTS FAILED - Security Issue Detected');
  console.log('   Manual review required');
}
