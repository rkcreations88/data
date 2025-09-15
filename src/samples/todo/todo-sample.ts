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

import { Sample } from '../index.js';
import './todo-host.js';  // Side effect: registers todo-host

export const todoSample: Sample = {
    id: 'todo',
    title: 'Todo Application',
    description: 'A complete todo application demonstrating ECS architecture, state management, undo/redo, and persistence.',
    category: 'Application Examples',
    difficulty: 'intermediate',
    features: [
        'Entity-Component-System (ECS)',
        'State Management',
        'Undo/Redo System',
        'Local Storage Persistence',
        'Drag and Drop Reordering',
        'Reactive UI Updates'
    ],
    elementTag: 'todo-host'
};