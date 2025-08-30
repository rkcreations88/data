/*************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 *  Copyright 2024 Adobe
 *  All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.
 **************************************************************************/
import { DraggableProps, Vector2, useDraggable } from './use-draggable.js';
import { useElement } from './use-element.js';
import { createObservableEvent } from '@adobe/data/observe';

export type DragObserveProps = Pick<
    DraggableProps,
    'minDragDistance' | 'dragCursor' | 'addPlaceholder' | 'stopPropagation'
>;
export type DragStart = {
    readonly type: 'start' | 'cancel';
};
export type DragMove = {
    readonly type: 'move';
    readonly delta: Vector2;
    readonly position: Vector2;
};
export type DragEnd = {
    readonly type: 'end';
    readonly position: Vector2;
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
        () => ({
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
            onDragEnd: (_e, position) => {
                setDragState({ type: 'end', position });
            },
            onDragCancel: () => {
                setDragState({ type: 'cancel' });
            },
        }),
        dependencies
    );
    return dragState;
}
