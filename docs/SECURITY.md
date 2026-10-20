# Security model and remaining work

This developer preview has not undergone an independent security audit. It does
not reproduce Muse's secure hosted VM, independent permission authority,
credential substitution, kernel egress enforcement, or adversarial classifiers.

## Implemented boundaries

- Renderer sandbox, context isolation, no Node integration, restrictive CSP, no
  direct network, and exact main-window IPC sender validation.
- No HTML rendering of model responses. User/model text is escaped before DOM
  insertion. Files are edited as text and are not automatically executed.
- API keys/tokens encrypted with Electron `safeStorage`; on Windows this is
  DPAPI. Failure to encrypt blocks storage. Keys stay in the main process and are
  never returned by state snapshots or included in model context/activity logs.
- Official provider endpoints are fixed. Custom endpoints require HTTPS except
  loopback HTTP. Redirects are rejected to avoid forwarding credentials elsewhere.
- Cloud use requires consent for the current provider and data categories.
  No automatic retries, fallback provider, model substitution, or cloud upgrade.
- Exact action arguments are copied into pending approvals, which are single-use,
  revocable by cancellation, and expire after five minutes.
- Agent tools cannot escape the private workspace using absolute paths, parent
  traversal, Windows device paths, alternate streams or known filesystem links.
- Static HTTPS research resolves public IPv4 addresses and pins the connection to
  the checked address. Private destinations, redirects and non-text responses are
  rejected. Size, duration and inference-step limits bound work.
- Research Chromium is separate, denies permissions/downloads/popups and exposes
  only fixed text/link extraction. The agent has no click, form, cookie, arbitrary
  JavaScript, or password-input API.
- Python runs only in a disposable no-network, read-only Docker container with
  no host mounts, an unprivileged UID, dropped capabilities, resource limits and
  a time limit. The Docker daemon and image are trusted dependencies.
- MCP tokens are inserted outside model prompts. Tool invocation requires exact
  approval; errors never count as confirmed success. Uncertain external outcomes
  require the user to check the service before retrying.

## Known limitations

Local state, chat text and workspace documents are not encrypted. DPAPI does not
protect keys against a compromised Windows account or a compromised main process.
Nagol does not claim to prevent other processes under your account reading your
data. Protect the OS account and use appropriate full-disk encryption.

External web content and MCP descriptions/results can contain prompt injection.
Labels and approval cards reduce risk but do not prove a model is safe. Users
must review URLs, destinations, file replacements and connector arguments. Do not
approve a consequential call whose essential details are absent. Trusted MCP
servers enforce their own schemas and authorization; Nagol has no independent
semantic validation for arbitrary third-party tool arguments. A connector can
misrepresent effects. Native service-specific adapters are required for robust
payment/email semantics and idempotency.

Research-browser network checks run before Chromium requests but are not a
kernel firewall and do not pin Chromium DNS resolution. DNS rebinding and browser
exploits need further hardening. Browser snapshots can expose personal information
visible on a page after the user approves the read. Do not use the research window
for sensitive accounts during preview testing. Website credentials are not stored
in Nagol's API-key vault; normal Chromium site state may persist in its partition.

Workspace path checking does not defend against a malicious same-account process
racing path replacement. No privileged host boundary is claimed. Actual junction
creation could not be tested in the restricted authoring environment.

The JSON store is suitable for a small single-user preview, not large concurrent
databases. Operation traces are summaries rather than a durable transaction log.
There is no automatic task recovery after crashes or external-call idempotency.
The app does not automatically resume or retry purchases or messages.

## Before a stable release

Complete the desktop smoke tests, use actual provider/MCP test accounts, conduct
prompt-injection and boundary testing, implement recovery/migrations and richer
audit receipts, pin the dependency lockfile, review bundled notices, sign builds,
and verify update/installer behavior. Run on a clean standard-user Windows VM.
Do not distribute API keys, account data or model weights without permission.

To report an issue after publication, use the repository's private vulnerability
reporting if enabled. Never put keys or personal conversation data in public issues.
