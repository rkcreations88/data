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

import { Data } from '../../core/data.js';

export type SequentialActionResult<Args extends Data[]> = {
    update: (...args: Args) => SequentialActionResult<Args>;
    cancel: () => void;
    commit: () => void;
};

/**
 * A function that represents a transient, sequential series of actions that must end with a commit or cancel.
 * This is the only service action which can return a value other than void.
 * It is intended to be used for multiframe transactions.
 */
export type SequentialAction<Args extends Data[]> = (...args: Args) => SequentialActionResult<Args>;

/**
 * Executes a sequential action using an async iterable iterator that provides the arguments.
 * @param action - The action to execute.
 * @param argProvider - An async iterable iterator of arguments to pass to the action.
 */
export async function executeSequentialAction<Arg extends Data>(action: SequentialAction<[Arg]>, argProvider: AsyncIterableIterator<Arg>) {
    let sequence: SequentialActionResult<[Arg]> | undefined;
    try {
        //  get the next arguments from the arg provider
        for await (const arg of argProvider) {
            //  then write them into the multiframe transaction (persisting this set of updates into database)
            sequence = (sequence?.update ?? action)(arg);
        }
        //  everything succeeded, finalize this transaction.
        sequence?.commit();
    }
    catch (e) {
        //  cancel the sequence
        sequence?.cancel();
        //  allow the async iterable iterator to finalize and close any open resources
        argProvider.throw?.(e);
    }
}