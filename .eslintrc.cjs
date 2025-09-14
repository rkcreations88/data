// Define a concise header format with dynamic year
const currentYear = new Date().getFullYear();
const headerLines = [
  'MIT License',
  '',
  `© Copyright ${currentYear} Adobe. All rights reserved.`,
  '',
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  '',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
];

module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['header'],
  rules: {
    'header/header': [
      'error',
      'block',
      headerLines,
    ],
    '@typescript-eslint/no-explicit-any': 'off',  // Allow 'any' type
    '@typescript-eslint/no-non-null-assertion': 'off',  // Allow non-null assertions
    '@typescript-eslint/ban-types': 'off', // Disable banning of certain types
    '@typescript-eslint/no-empty-function': 'off', // Allow empty functions
    '@typescript-eslint/no-unused-vars': 'off', // Allow unused variables
  },
  ignorePatterns: ['.eslintrc.cjs', 'docs', 'dist', 'tests', 'vite.config.js'],  // Updated ignore patterns
};
