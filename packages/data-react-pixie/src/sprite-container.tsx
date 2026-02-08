import { useObservableValues } from "@adobe/data-react";
import { useDatabase } from "./hooks/use-database";
import { Sprite } from "./sprite";

export function SpriteContainer() {
    const db = useDatabase();
    const values = useObservableValues(() => ({
        sprites: db.observe.select(db.archetypes.Sprite.components),
    }), []);
    if (!values) return;

    return (
        <pixiContainer>
            {values.sprites.map((entity) => (
                <Sprite key={entity} entity={entity} />
            ))}
        </pixiContainer>
    );
}