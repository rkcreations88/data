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
import { DragEnd, DragMove, DragObserveProps, useDragObserve } from './use-drag-observe.js';
import { useEffect } from "./use-effect.js";
import { AsyncArgsProvider } from '@adobe/data/ecs';
import { toAsyncGenerator, withFilter } from '@adobe/data/observe';

export type DragTransactionProps<T> = DragObserveProps & {
    transaction: (asyncArgs: AsyncArgsProvider<T>) => void;
    update: (drag: DragMove) => T;
    finish: (drag: DragEnd) => T;
};

export function useDragTransaction<T>(propsFactory: () => DragTransactionProps<T>, dependencies: unknown[]) {
    const props = propsFactory();
    const { transaction, update, finish } = props;
    const dragObserve = useDragObserve(props, dependencies);
    const startDragTransaction = () => {
        let done = false;
        // we start the transaction by calling it with an async generator that will yield the args asynchronously
        transaction(
            // we create the async generator by mapping the dragObserve state changes to transaction args
            () =>
                toAsyncGenerator(
                    // this uses the withMap function and the provided update and finish functions
                    // any type 'start' will just be ignored and filtered out
                    withFilter(dragObserve, value => {
                        if (value.type === 'end') {
                            done = true;
                            return finish(value);
                        }
                        if (value.type === 'move') {
                            return update(value);
                        }
                    }),
                    _value => done
                )
        );
    };
    // now we will observe the drag state and start a new transaction whenever a drag starts
    useEffect(() => {
        return dragObserve(value => {
            if (value.type === 'start') {
                startDragTransaction();
            }
        });
    }, dependencies);
}
