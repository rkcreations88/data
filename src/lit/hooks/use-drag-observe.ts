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

import { DraggableProps, useDraggable } from './use-draggable.js';
import { useElement } from './use-element.js';
import { createObservableEvent } from '../../observe/index.js';
import { Vec2 } from '../../math/index.js';

export type DragObserveProps = Pick<
    DraggableProps,
    'minDragDistance' | 'dragCursor' | 'addPlaceholder' | 'stopPropagation'
>;
export type DragStart = {
    readonly type: 'start' | 'cancel';
};
export type DragMove = {
    readonly type: 'move';
    readonly delta: Vec2;
    readonly position: Vec2;
};
export type DragEnd = {
    readonly type: 'end';
    readonly delta: Vec2;
    readonly position: Vec2;
};
export type DragState = DragStart | DragMove | DragEnd;

/**
 * This hook creates a drag observe function that can be used to observe the drag state of an element.
 * This is normally not used directly, but rather through the `useDragTransaction` hook.
 * @param props
 * @returns
 */
export function useDragObserve(props: DragObserveProps, dependencies: unknown[]) {
    const [dragState, setDragState] = createObservableEvent<DragState>();
    const element = useElement();
    useDraggable(element,
        {
            ...props,
            onDragStart: _e => {
                setDragState({ type: 'start' });
            },
            onDrag: (_e, position, delta) => {
                setDragState({
                    type: 'move',
                    position,
                    delta,
                });
            },
            onDragEnd: (_e, position, delta) => {
                setDragState({ type: 'end', position, delta });
            },
            onDragCancel: () => {
                setDragState({ type: 'cancel' });
            },
        },
        dependencies
    );
    return dragState;
}
