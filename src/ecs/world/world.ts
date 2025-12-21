import { FromSchemas } from "../../schema/index.js";
import { StringKeyof } from "../../types/types.js";
import { ArchetypeComponents, ComponentSchemas, Components, Database, OptionalComponents, ResourceComponents, ResourceSchemas } from "../index.js";
import { ActionDeclarations, ActionFunctions, ToActionFunctions } from "../store/action-functions.js";
import { SystemDeclaration } from "./system-declaration.js";

export interface World<
    C extends Components,
    R extends ResourceComponents,
    A extends ArchetypeComponents<StringKeyof<C & OptionalComponents>>,
    F extends ActionFunctions,
> {

    readonly database: Database<C, R, A, F>;

    extend<S extends World.Schema<any, any, any, any, any>>(schema: S): World<
        C & (S extends World.Schema<infer XC, any, any, any, any> ? FromSchemas<XC> : never),
        R & (S extends World.Schema<any, infer XR, any, any, any> ? FromSchemas<XR> : never),
        A & (S extends World.Schema<any, any, infer XA, any, any> ? XA : never),
        F & (S extends World.Schema<any, any, any, infer XF, any> ? XF : never)
    >;

}

export namespace World {

    export interface Schema<
        C extends ComponentSchemas,
        R extends ResourceSchemas,
        A extends ArchetypeComponents<StringKeyof<C>>,
        T extends ActionDeclarations<FromSchemas<C>, FromSchemas<R>, A>,
        S extends string,
    > {
        components: C;
        resources: R;
        archetypes: A;
        transactions: T;
        systems: { readonly [K in S]: SystemDeclaration<K> };
        create(db: Database<FromSchemas<C>, FromSchemas<R>, A, ToActionFunctions<T>>): { readonly [K in S]: () => void };
    }

    export namespace Schema {

        export function create<
            C extends ComponentSchemas,
            R extends ResourceSchemas,
            A extends ArchetypeComponents<StringKeyof<C>>,
            T extends ActionDeclarations<FromSchemas<C>, FromSchemas<R>, A>,
            S extends string,
        >(
            schema: World.Schema<C, R, A, T, S>,
        ): World.Schema<C, R, A, T, S> {
            return schema satisfies World.Schema<C, R, A, T, S>;
        }

    }
}
