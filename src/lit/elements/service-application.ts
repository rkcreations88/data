import { html, LitElement, PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { provide } from "@lit/context";
import { serviceContext } from "./service-context.js";
import { Service } from "../../service/index.js";

export abstract class ServiceApplication<S extends Service> extends LitElement {

    @provide({context: serviceContext})
    @property({type: Object})
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
