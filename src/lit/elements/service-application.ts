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

import { html, LitElement, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { provide } from "@lit/context";
import { serviceContext } from "./service-context.js";
import { Service } from "../../service/index.js";

export abstract class ServiceApplication<S extends Service> extends LitElement {

    @provide({ context: serviceContext })
    @property({ type: Object })
    protected service!: S;

    protected abstract createService(): Promise<S>;

    override async updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        this.service ??= await this.createService();
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this.service?.dispose?.();
        this.service = null as any;
    }

    override render() {
        return html`
            <div>Service Application Should Be Overridden</div>
        `;
    }
}
