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

import { useEffect } from './use-effect.js';

export type Vector2 = readonly [number, number];

function toCssUnitString(value: number): string {
    return `${value}px`;
}

export interface DraggableProps {
    //  onDragStart should return the initial position of the element
    onDragStart: (e: PointerEvent) => Vector2 | void;
    onDrag: (e: PointerEvent, newPosition: Vector2, delta: Vector2) => void;
    onDragEnd?: (e: PointerEvent, newPosition: Vector2) => void;
    /**
     * Called if this hook is destroyed before the drag is completed.
     */
    onDragCancel?: () => void;
    initialDownPosition?: Vector2;
    minDragDistance?: number;
    dragCursor?: string;
    addPlaceholder?: boolean;
    stopPropagation?: boolean;
}

export function useDraggable(element: HTMLElement, propsFunction: () => DraggableProps, dependencies: unknown[]) {
    const props = propsFunction();
    const { minDragDistance = 10, dragCursor = 'grab', addPlaceholder = false, initialDownPosition = null, stopPropagation = false } = props;
    useEffect(() => {
        let downPosition: Vector2 | null = null;
        let isDragging = false;
        let startPosition!: Vector2;
        let originalCursor = '';
        let placeholder: HTMLElement | null = null;
        let lastPosition: Vector2 = [0, 0];
        function getRelativePosition(e: PointerEvent): Vector2 {
            if (!downPosition) {
                throw new Error("This cannot happen as we don't listen to pointermove until pointerdown occurs.");
            }
            return [e.clientX - downPosition[0], e.clientY - downPosition[1]];
        }

        function onPointerMove(e: PointerEvent) {
            const relative = getRelativePosition(e);
            const distance = Math.sqrt(Math.pow(relative[0], 2) + Math.pow(relative[1], 2));
            if (distance >= minDragDistance) {
                if (!isDragging) {
                    isDragging = true;
                    startPosition = props.onDragStart(e) ?? [0, 0];
                    if (dragCursor) {
                        originalCursor = element.style.cursor;
                        element.style.cursor = dragCursor;
                    }
                    // add a placeholder so the parent element doesn't change size when the element is dragged.
                    if (addPlaceholder) {
                        placeholder = document.createElement('div');
                        Object.assign(placeholder.style, {
                            position: 'absolute',
                            backgroundColor: 'pink',
                            left: toCssUnitString(element.offsetLeft),
                            top: toCssUnitString(element.offsetTop),
                            width: toCssUnitString(element.offsetWidth),
                            height: toCssUnitString(element.offsetHeight),
                            visibility: 'hidden',
                        });
                        element.parentElement?.appendChild(placeholder);
                    }
                }
            }
            if (isDragging) {
                lastPosition = [startPosition[0] + relative[0], startPosition[1] + relative[1]];
                props.onDrag(e, lastPosition, relative);
            }
            if (stopPropagation) e.stopPropagation();
        }
        function cleanup() {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointermove', onPointerMove);
            if (dragCursor) {
                element.style.cursor = originalCursor;
            }
            if (placeholder) {
                placeholder.remove();
                placeholder = null;
            }
        }
        function onPointerUp(e: PointerEvent) {
            cleanup();
            if (isDragging) {
                props.onDragEnd?.(e, lastPosition);
            }
            if (stopPropagation) e.stopPropagation();
            downPosition = null;
            isDragging = false;
        }
        function onPointerDown(e: PointerEvent) {
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            downPosition = [e.clientX, e.clientY];
            if (stopPropagation) e.stopPropagation();
        }

        if (initialDownPosition) {
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', onPointerUp);
            downPosition = initialDownPosition;
        }

        element?.addEventListener('pointerdown', onPointerDown);
        return () => {
            element?.removeEventListener('pointerdown', onPointerDown);
            if (downPosition) {
                cleanup();
            }
            if (isDragging) {
                props.onDragCancel?.();
            }
        };
    }, [element, initialDownPosition, ...(dependencies ?? [])]);
}
