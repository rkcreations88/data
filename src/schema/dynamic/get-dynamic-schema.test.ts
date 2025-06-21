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
import { describe, it, expect } from 'vitest';
import { getDynamicSchema } from './get-dynamic-schema.js';
import { PersonSchema, PersonSchemaWithOneOf, PersonSchemaRootConditions } from './enumerate-patches.test.js';
import { Schema } from '../schema.js';

describe('getDynamicSchema', () => {
    it('should not modify schema when local condition is not met', () => {
        const dynamicSchema = getDynamicSchema(PersonSchema, {
            name: "John Doe",
            age: 20,
        });

        // Email UI should remain unchanged
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
        });
    });

    it('should modify schema when local condition is met', () => {
        const dynamicSchema = getDynamicSchema(PersonSchema, {
            name: "John Doe",
            age: 10,
        });

        // Email UI should be hidden
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
            visible: false,
        });
    });

    it('should apply oneOf conditions for human', () => {
        const dynamicSchema = getDynamicSchema(PersonSchemaWithOneOf, {
            name: "John Doe",
            species: "human",
        });

        // Email UI should be visible
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
            visible: true,
        });
    });

    it('should apply oneOf conditions for robot', () => {
        const dynamicSchema = getDynamicSchema(PersonSchemaWithOneOf, {
            name: "John Doe",
            species: "robot",
        });

        // Email UI should be disabled
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
            enabled: false,
        });
    });

    it('should apply complex root conditions', () => {
        const dynamicSchema = getDynamicSchema(PersonSchemaRootConditions, {
            name: "John Doe",
            species: "human",
        });

        // Email UI should be visible due to name length > 3 and species being human
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
            visible: true,
        });
    });

    it('should apply simple root conditions', () => {
        const dynamicSchema = getDynamicSchema(PersonSchemaRootConditions, {
            name: "ab",
            species: "human",
        });

        // Email UI should be hidden due to name length <= 2
        expect(dynamicSchema.properties?.email?.ui).toEqual({
            name: "Email",
            placeholder: "john.doe@example.com",
            visible: false,
        });
    });

    it('should throw error when target node is not an object', () => {
        const invalidSchema = {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    conditionals: [{
                        path: "$.type",  // targeting a string, not an object
                        value: { visible: false }
                    }]
                }
            }
        } as const satisfies Schema;

        expect(() => getDynamicSchema(invalidSchema, {
            name: "John Doe"
        })).toThrow('Target node MUST be an object');
    });
}); 