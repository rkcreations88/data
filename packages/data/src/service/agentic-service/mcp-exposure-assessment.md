# AgenticService → MCP Exposure Assessment

**Purpose:** Assess how easily the current AgenticService interface could be exposed as an MCP (Model Context Protocol) server. No implementation is planned; this is a design and feasibility summary.

---

## Summary

**Verdict: Straightforward.** The agentic service surface aligns well with MCP’s tools model. A thin adapter can map **actions → MCP tools**, **execute → tools/call**, and **observable actions → listChanged**. State and links require small design decisions (state as context vs resources; links as namespaced tools or out-of-band). Schema types are JSON Schema–compatible, so no schema translation layer is needed.

---

## AgenticService Surface (Recap)

| Surface       | Type / behavior |
|---------------|------------------|
| **states**    | `Observe<Record<string, State>>` — each entry has `schema` (JSON Schema–like) and `value`. Conditionally visible. |
| **actions**   | `Observe<Record<string, Action>>` — each entry has `description`, `schema` (input), `execute`. Conditionally visible. |
| **execute**   | `(action: string, input: unknown) => Promise<void \| ActionError>`. ActionError is a string. |
| **links**     | Optional `Observe<AgenticServiceLinks>` — map of keys to other AgenticServices. |

State and action schemas use the project’s `Schema` type (see `schema.ts`), which is compatible with JSON Schema (type, description, properties, required, etc.), with minor extensions.

---

## MCP Surface (Relevant Parts)

- **Tools:** Servers expose tools via `tools/list` (name, description, inputSchema) and handle `tools/call(name, arguments)`. Results use `content[]` and `isError`.
- **List changed:** Servers can declare `listChanged: true` and send `notifications/tools/list_changed` when the set of tools changes.
- **Resources:** Optional; URI-addressable context (read-only). Not required for a tools-only server.
- **Transport:** JSON-RPC 2.0 over stdio, SSE, or HTTP.

---

## Mapping

### Actions → MCP tools

- **tools/list:** On request, sample the current `actions` observable (or a cached snapshot updated on subscription). For each entry, emit one MCP tool:
  - `name` = action key
  - `description` = action’s `description`
  - `inputSchema` = action’s `schema` (use as-is if already JSON Schema–compatible; otherwise a small normalizer for any project-specific fields).
- **listChanged:** Subscribe to the same `actions` observable; when the emitted map changes, send `notifications/tools/list_changed`. Fits the existing reactive model.

### execute → tools/call

- On `tools/call(name, arguments)`:
  - Call `execute(name, arguments)`.
  - If result is `undefined` → success: return `content: [{ type: "text", text: "" }]`, `isError: false`.
  - If result is `ActionError` (string) → return that string in a single text content block and set `isError: true`.

No change to AgenticService is required; the adapter owns the MCP response shape.

### States → context for the model

- MCP has no direct “state” primitive. Options:
  1. **Omit from MCP:** Only expose actions; state is internal.
  2. **Resource per state:** Expose each state as a resource (e.g. `mcp://server/state/<key>`), updated when the state observable emits. Requires implementing the resources capability and a subscription/cache.
  3. **Single “get_state” tool:** One tool that returns the current state snapshot (e.g. JSON). Simple but not incremental; good for small state.

Choice is product-driven; any option is implementable without changing the AgenticService interface.

### Links → other services / tools

- MCP does not define “nested servers” in one process. Options:
  1. **Namespaced tools:** For each link, expose its actions as tools with a prefix (e.g. `child.heal`). The adapter would need to subscribe to each linked service’s `actions` and merge into one tool list, and route `tools/call` to the correct service.
  2. **Out-of-band:** Expose links only via a custom tool or resource (e.g. “list_links” returning URIs or identifiers). Clients that understand the convention could then open separate MCP connections or sessions per link.
  3. **Single flat tool list:** Merge all linked services’ actions into one namespace with a naming convention; route calls by name. Same as (1) with a single flat prefix scheme.

(1) or (3) give a single MCP server that fully reflects the agentic graph; (2) keeps the protocol minimal and pushes composition to the client.

---

## Gaps and Choices

| Topic              | Notes |
|--------------------|--------|
| **Observe vs request/response** | MCP is pull (list, call). We have push (Observe). Adapter must subscribe to `actions` (and optionally `states`, `links`), cache the latest value, and serve list/call from that cache. List changed is a natural fit. |
| **Schema compatibility**       | Project `Schema` is JSON Schema–compatible. Use as `inputSchema` directly; strip or map any non-standard fields (e.g. `layout`, `conditionals`) if MCP clients must see strict JSON Schema. |
| **Errors**                     | ActionError is a string. Map to MCP tool result with `isError: true` and one text content block. |
| **Transport**                  | Out of scope for AgenticService; the adapter would use an existing MCP SDK (e.g. TypeScript) for stdio/SSE/HTTP and JSON-RPC. |

---

## Implementation Effort (Rough)

- **Minimal (actions + execute only):** One adapter module that holds an `AgenticService`, implements `tools/list` and `tools/call` from the cached `actions` observable and `execute`, and optionally sends `list_changed` when the actions map changes. **Low effort** (e.g. on the order of a day for a single transport).
- **With state:** Add either a “get_state” tool or a resources implementation and URI scheme for state. **Low–medium.**
- **With links:** Merge linked services’ tools (with namespacing) and route calls. **Medium** (subscription and name-routing logic, no AgenticService change).

No changes to the core AgenticService interface are required for any of the above; all mapping lives in the MCP adapter.

---

## Recommendations

1. **Keep AgenticService as-is.** It is already a good fit for MCP tools and listChanged; no API changes are needed for a first MCP exposure.
2. **Implement an MCP adapter in a separate layer** (e.g. `mcp-server` or `adapters/mcp`) that depends on the data package and an MCP SDK, and takes one or more `AgenticService` instances.
3. **First version:** Expose only actions and execute; add `listChanged` from the actions observable. Defer state and links to a later iteration once product needs are clear.
4. **Schema:** Document or add a small `toJSONSchema(schema: Schema)` if MCP clients must receive strict JSON Schema; otherwise use the current schema shape as-is for `inputSchema`.

---

## References

- [MCP specification (overview)](https://modelcontextprotocol.io/specification/latest)
- [MCP tools (list, call, listChanged)](https://modelcontextprotocol.io/docs/concepts/tools)
- Project: `data/packages/data/src/service/agentic-service/` (interface, create, state, action, schema usage)
