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

import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { attachDecorator, withHooks } from '../hooks/index.js';
import { iterateSelfAndAncestors } from '../functions/index.js';
import { Service, isService } from '../../service/index.js';

export class ApplicationElement<MainService extends Service> extends LitElement {
  @property({ type: Object, reflect: false })
  service!: MainService;

  constructor() {
    super();
    attachDecorator(this, 'render', withHooks);
  }

  connectedCallback(): void {
    super.connectedCallback();

    if (!this.service) {
      const service = this.findAncestorService();
      if (service) {
        this.service = service;
      }
    }
  }

  protected findAncestorService(): MainService | void {
    for (const element of iterateSelfAndAncestors(this)) {
      const { service } = element as Partial<ApplicationElement<MainService>>;
      if (isService(service)) {
        return service;
      }
    }
  }

  render() {
    throw new Error('render function must be overridden');
  }

}
