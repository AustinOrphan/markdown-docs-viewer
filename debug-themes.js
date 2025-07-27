// Debug script to check themes
import { themes } from './src/themes.js';

console.log('Themes object keys:', Object.keys(themes || {}));
console.log('vscode theme exists:', !!themes?.vscode);
console.log('vscode theme structure:', themes?.vscode ? Object.keys(themes.vscode) : 'undefined');
