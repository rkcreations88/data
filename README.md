# @adobe/data
Adobe Data Oriented Programming Library

## Documentation

[Main Page](https://git.corp.adobe.com/pages/neuralfiltersplatform/firefly-data/docs/api/)

[ECS Performance Test](https://git.corp.adobe.com/pages/neuralfiltersplatform/firefly-data/docs/perftest.html)

## Breaking API Changes

Until we reach 1.0.0, minor version changes may be API breaking.

## Data

This library uses data oriented design paradigm and prefers pure functional interfaces whenever practical.

For our purposes, `Data` is immutable `JSON` (de)serializable objects and primitives.

### Why immutable Data?

We prefer Data because it is easy to:
- serialize
- deserialize
- inspect
- compare
- hash
- validate

We prefer immutable Data because it is easy to:
- reason about
- avoid side effects
- avoid defensive copying
- use for pure function arguments and return values
- use with concurrency
- memoize results
    - use as cache key (stringified)
    - use as cache value

### What is Data Oriented Design?

Sanders Mertens covers this thoroughly in his ECS FAQ:

[https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-data-oriented-design](https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-data-oriented-design)

### Data Schemas

When runtime type information is required we use `JSON Schema`. In order to avoid redundancy, we can use `FromSchema` to derive a typescript type at compile time.

Example:

```typescript
const Float32Schema = { type: "number", precision: 1 } as const satisfies Schema;
const Float32 = FromSchema<typeof Float32Schema>; // number
```

It is important that we use `as const` for the schema definition. Without that, the typeof Float32Schema would be `{ type: string, precision: number }` instead of `{ type: "number", precision: 1 }` and we would not be able to derive a correct type using `FromSchema`.

### Normalized Data

Data is considered "Normalized" when all object keys contained anywhere within it are alphabetically sorted. We include a `normalize` function which performs this conversion. This is particularly useful when you want to use data as a cache key.

```typescript
const notNormalized = { b: 2, a: 1 };
const normalized = normalize(notNormalized); // { a: 1, b: 2 }
```

## Observables

An `Observable<T>` is a subscription function that you can pass a callback function to. Your callback function can accept a single argument of type `T`. The subscription function returns a dispose function that accepts no parameters and can be called at any point in the future to cancel your subscription.

Your callback function *may* be called back synchronously (before the initial call returns) zero or one times and asynchronously later any number of times.

For more information see the [Observable API documentation](./docs/api/modules/observe.html)

### Observable Types

```typescript
/**
 * Called to add a new observer to an Observable.
 * Returns an Unobserve function that can be called to stop observing the Observable.
 */
export type Observable<T> = (observer: Callback<T>) => Unobserve;
/**
 * Callback function called zero or more times with a sequence of values.
 * *may* be called back synchronously, immediately when selector function is called.
 * *may* also be called back asynchronously later any number of times.
 * *may* be called multiple sequential times with the same value.
 */
export type Callback<T> = (value: T) => void;
/**
 * Function called to stop observing an Observable.
 */
export type Unobserve = () => void;
```

An Observable can be thought of sort of like a Promise but with a few important differences.
- A Promise only yields a single value, an Observable yields a sequence of values.
- A Promise can reject with an error, an Observable can not. (It could yield type `MyResult | MyError` though.)
- A Promise can only resolve asynchronously, an Observable *may* yield an initial result synchronously.
    - An Observable is allowed to call the Callback callback function immediately upon observation if it has a value.
- A Promise begins executing immediately, an Observable may lazily wait for a first observer before taking any action.
- An Observable can be unobserved.

### Observable Creation

This simple definition of an Observable makes it very easy to create them from various sources.

- `fromConstant<T>(value: T) => Observable<T>`
- `fromPromise<T>(promise: Promise<T>): Observable<T>`
- `fromPromiseWithError<T, E extends Error>(promise: Promise<T>): Observable<T | E>`
- `fromObservableProperties` converts an object with named Observable values into a single Observable of an object with corresponding types.

For instance:

```typescript
fromObservables({ a: fromConstant(1), b: fromConstant("s")})
// yields type Observable<{ a: number, b: string }>
```

`fromObservableProperties` will only yield a result once every contained observable has provided a result. If some properties are optional then use the `withOptional` higher order function described below.

### Observable Modification

They are also very easy to modify in order to build higher order Observables.

For the purposes of discussion let us use an array to indicate the sequential values yielded by an Observable with the first element being any synchronous callback and `void` meaning no synchronous callback.

So our `fromConstant(12)` would yield `[12]` and `fromPromise(Promise.resolve(12))` would yield `[void, 12]`

These examples will use the form of: Sequence Before => Higher Order Function => Sequence After.

withDeduplicate removes any sequentially equivalent values:

`[1, 1, 2, 2, 2, 3]` => `withDeduplicate` => `[1, 2, 3]`

withDefault replaces any undefined values, including initial synchronous value with a default value:

`[void, 1, 2, undefined, 4]` => `withDefault(-1)` => `[-1, 1, 2, -1, 4]`

withMap applies a mapping function to each value at notification time:

`[void, 1, 2, 3]` => `withMap(x => x * 2)` => `[void, 2, 4, 6]`

withOptional converts an `Observable<T>` to `Observable<T | undefined>` and will always respond synchronously.

`[void, 1, 2, 3, 4]` => `withOptional` => `[undefined, 1, 2, 3, 4]`

## Cache

The cache module contains functions and interfaces related to caching, hashing, memoization and storage and retrieval of `Blob`s.

The `memoize` function and `BlobStore` are the most important public interfaces in the cache submodule. They are described below. See the API reference for hashing and other lower level functions.

The `memoize` function can be used to cache expensive, deterministic, asynchronous functions that take data arguments and return data results. In addition to caching the results, it also blocks multiple simultaneous calls with the same arguments and makes them wait for the first result.

### BlobStore

It is important to handle `Blob`s correctly within an application. Retaining references to a large number of them can cause memory problems depending upon their size.

The `BlobStore` interface and corresponding `blobStore` exported instance provide a convenient way to convert `Blob`s into small JSON handles to them called `BlobRef`s. Those `BlobRef`s can later be converted back into a `Blob`.

`Blob`s within the `blobStore` are generally persisted across sessions using the browsers buid in `Cache` storage.

`BlobRef`s have a number of advantages over directly using blobs.
`BlobRef`s are:
- small json objects
- use negligible memory since the `Blob` is stored on disc till needed.
- deterministic for each `Blob` based on mime type and content.
- suitable for persistence to locations with limited size.
- suitable for use as a cache key
- suitable for use as a cache value

## Schemas

Contains some standard data type schemas in JSON Schema format for convenience. These types are most frequently used when describing components within the Entity Component System. Knowing the precise size and signedness of primitive numeric types allows the ECS to store these values within tightly packed typed arrays internally. This makes memory usage and processing time more efficient.

## Entity Component System (ECS)

This ECS database is a high performance, strongly typed typescript implementation inspired by the Sanders Mertens C++ based [Flecs](https://www.flecs.dev/flecs/md_docs_2Docs.html).

This library provides three different high performance ECS interfaces. They each share the same basic read API but differ in their interface for writing and observability of changes.

- [ECS](./docs/api/interfaces/ecs.ECS.html)
    - allows direct write access to the data.
    - no changes are observability.
- [Transaction ECS](./docs/api/interfaces/ecs.TransactionECS.html)
    - requires transactions for writing changes.
    - all changes are observable.
- [Action ECS](./docs/api/interfaces/ecs.ActionECS.html)
    - requires pre-defined actions for writing changes.
    - actions are implemented using transactions.
    - action functions must be synchronous and may never throw.
    - all changes are observable.
    - provides Operational Transform to resolve concurrent multi player edits.

### What is an ECS?

Sanders Mertens also covers this thoroughly in his ECS FAQ:

[https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-ecs](https://github.com/SanderMertens/ecs-faq?tab=readme-ov-file#what-is-ecs)

In addition to the Entity, Component and System definitions which are standard, we also use the term Resource. A Resource is just a value which is defined globally on the ECS itself and not attached to any specific Entity.

### Action ECS Usage

```typescript
//  create an action ecs
const ecs = createActionECS()
  //  define components with schemas
  .withComponents({
    position: Vector3Schema,
    velocity: Vector3Schema,
    color: Vector4Schema,
    size: { type: "number" },
    health: { type: "number" },
    player: { const: true },
  } as const)
  //  define archetypes with component names
  .withArchetypes({
    particle: ["position", "velocity", "color", "size"],
    player: ["position", "health", "player"],
  })
  //  define resources with initial values
  .withResources({
    gravity: 9.8,
  })
  //  define actions with transactional functions
  .withActions({
    createParticle(t, props: { position: Vector3, velocity: Vector3, color: Vector4, size: number }) {
      t.createEntity(t.ecs.archetypes.particle, props);
    },
    deleteParticle(t, entity: number) {
      t.deleteEntity(entity);
    },
    createPlayer(t, position: Vector3) {
      t.createEntity(t.ecs.archetypes.player, { position, health: 100, player: true });
    },
    movePlayer(t, entity: number, position: Vector3) {
      t.setComponentValue(entity, "position", position);
    },
    setGravity(t, gravity: number) {
      t.resources.gravity = gravity;
    },
  })

//  call some actions to modify the ECS
ecs.actions.createParticle({ position: [0, 0, 0], velocity: [1, 0, 0], color: [1, 1, 1, 1], size: 1 });
ecs.actions.createParticle({ position: [1, 1, 1], velocity: [1, 1, 1], color: [1, 1, 1, 1], size: 2 });
ecs.actions.createPlayer([10, 20, 0]);
ecs.actions.movePlayer(1, [10, 20, 0]);

//  read some values from the ECS
const players = ecs.selectEntities(ecs.archetypes.player);
const particles = ecs.selectEntities(ecs.archetypes.particle);

//  observe changes to the ECS
ecs.observe.archetypeEntities(ecs.archetypes.player)((playerEntities) => {
  for (const playerEntity of playerEntities) {
    const player = ecs.getEntityValues(playerEntity);
    console.log("Player entity changed", player);
  }
});

```

### ECS Persistence

The ECS can be converted to JSON and from JSON.

The persistence format is logically consistent with the internal ECS data format so studying it may help you understand how an ECS is structured:

```typescript
{
  ecs: true,
  version: 2,
  components: {
    id: { type: 'integer', minimum: +0, maximum: 4294967295 },
    position: { type: 'array', items: { type: 'number', precision: 1 }, minItems: 3, maxItems: 3 },
    velocity: { type: 'array', items: { type: 'number', precision: 1 }, minItems: 3, maxItems: 3 },
    color: { type: 'array', items: { type: 'number', precision: 1 }, minItems: 3, maxItems: 3 },
    size: { type: 'number' }, health: { type: 'number' }, player: { const: true },
    gravity: {}
  },
  //  The main entities table has two entries for each entity.
  //  The first value is the index of the tables array and represents the entities archetype.
  //  The second value is the row of the entity within the archetype table.
  entities: [ 3, +0, 1, +0, 1, +1, 2, +0 ],
  tables: [
    { rows: +0, columns: { id: [] } },  // the empty archetype contains only an id component
    {
      rows: 2,
      columns: {
        //  component data is stored as Structure of Arrays (SoA)
        id: [ 1, 2 ],
        color: [ [1, 0, 0, 0], [1, 1, 1, 1] ],
        position: [ [0, 0, 0, 0], [1, 1, 1, 1] ],
        size: [ 1, 2 ],
        velocity: [ [0, 0, 0], [1, 1, 1] ]
      }
    },
    { rows: 1, columns: { id: [ 3 ], health: [ 100 ], player: true, position: [ [ 10, 20, +0 ] ] } },
    { rows: 1, columns: { gravity: [ 9.8 ], id: [ +0 ] } }  // resources are stored internally as components
  ]
}
```

## Performance Test

[Performance Test](https://git.corp.adobe.com/pages/neuralfiltersplatform/firefly-data/docs/perftest.html)
