#!/usr/bin/env node
/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

/* eslint-disable no-undef */
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The correct MIT license header
const MIT_HEADER = `/*MIT License

© Copyright 2025 Adobe. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/`;

// Pattern to match MIT license headers (with some flexibility)
const MIT_HEADER_PATTERN = /\/\*MIT License[\s\S]*?THE SOFTWARE IS PROVIDED "AS IS"[\s\S]*?DEALINGS IN THE SOFTWARE\.\*\//g;

function fixFileHeaders(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file already has the correct header at the beginning
    if (content.startsWith(MIT_HEADER)) {
      console.log(`✓ ${filePath} - already has correct header`);
      return;
    }
    
    // Remove all existing MIT headers
    let cleanedContent = content.replace(MIT_HEADER_PATTERN, '');
    
    // Remove leading whitespace and newlines
    cleanedContent = cleanedContent.replace(/^\s+/, '');
    
    // Add the correct header at the beginning
    const fixedContent = MIT_HEADER + '\n\n' + cleanedContent;
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`✓ ${filePath} - fixed headers`);
    
  } catch (error) {
    console.error(`✗ ${filePath} - error: ${error.message}`);
  }
}

async function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  
  // Find all TypeScript files in src directory
  const pattern = path.join(srcDir, '**/*.ts');
  const files = await glob(pattern, { ignore: ['**/*.d.ts', '**/node_modules/**'] });
  
  console.log(`Found ${files.length} TypeScript files to check...`);
  
  let fixedCount = 0;
  let alreadyCorrectCount = 0;
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.startsWith(MIT_HEADER)) {
      alreadyCorrectCount++;
    } else {
      fixFileHeaders(file);
      fixedCount++;
    }
  });
  
  console.log(`\nSummary:`);
  console.log(`- Files already correct: ${alreadyCorrectCount}`);
  console.log(`- Files fixed: ${fixedCount}`);
  console.log(`- Total files processed: ${files.length}`);
}

main().catch(console.error); 