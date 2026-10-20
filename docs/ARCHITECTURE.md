# Architecture and implementation decisions

Windows desktop was explicitly selected. Electron provides a consistent UI,
Chromium research browser, Windows-backed key encryption, tray lifecycle,
notifications and PDF output. The trade-off is a larger distribution and more RAM
than a native or Tauri shell. Tauri would add Rust/WebView2 tooling and complicate
an embedded research browser. A hosted web application would require accounts,
server security, hosting and a separate local-file agent.

This implementation uses CommonJS JavaScript, Node built-ins, and plain DOM/CSS.
There are no runtime npm dependencies beyond Electron. This makes the core
testable offline and reduces the dependency surface. Files are deliberately
small modules by responsibility; the UI can later move to a component framework.

The sandboxed renderer has a narrow preload bridge. It cannot import Node, access
credentials, or call the network. IPC accepts only the expected main window and
exact local application document. The main process handles validation, data,
credentials, external requests and privileged OS operations. Research websites
have a separate persistent Chromium session and no application preload.

Providers normalize text request/response formats through a common adapter.
OpenAI/custom use Chat Completions, Anthropic uses Messages, Gemini uses
generateContent, and Ollama uses local chat plus model inspection. Credentials
are inserted in the transport layer, never added to model messages. An individual
run captures its provider configuration so UI changes cannot redirect an ongoing
conversation. Scheduled runs record the provider connection ID at creation.

The agent uses a deliberately small, model-independent JSON action protocol.
Native function-calling is not required; weaker models may produce malformed
actions, which remain text. JSON-following capability is opt-in. Tool execution
uses an allowlist and explicit validation; arbitrary model text never becomes a
host command. Every tool with external disclosure or write effects asks for a
one-use approval with copied parameters. Cancellation aborts model/network work
and invalidates approvals. Approval decisions originate in deterministic UI.

State is a versioned JSON file written via same-directory temp+rename. Corrupt
state stops startup instead of silently resetting. A single-instance lock and
synchronous mutations avoid concurrent writer races. Large datasets and
transactional task recovery should eventually migrate to SQLite. Tool results
feed the active inference loop; they are not persisted as a replayable execution
trace. A crash never resumes a potentially consequential operation automatically.

The scheduler stores UTC timestamps and minute intervals, checking every 15
seconds. User-entered times use the computer's timezone. Overdue recurring work
fires once, then advances beyond now. AI schedules create distinct chats and
still require cloud/tool approvals. Polling is implemented; event/webhook triggers
and a Windows background service are not.

MCP is limited to JSON-response Streamable HTTP with optional bearer auth. It
initializes, propagates session IDs, discovers tool schemas and invokes approved
tool calls. Stateful sessions, SSE-only servers, OAuth, pagination, and server
feature negotiation beyond this subset require extension. The UI labels this
compatibility boundary; a generic MCP client is not equivalent to preconfigured
Gmail/Calendar integrations.

The source is Windows-first. `npm run build` creates a portable Electron folder;
the runtime is copied with its licences. No installer, auto-updater, signature or
hosted service is represented as completed.
