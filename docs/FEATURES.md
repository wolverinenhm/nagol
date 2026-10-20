# Feature parity checklist

Reference reviewed on **20 October 2026**: the product currently at
https://muse.ai/ is Meta's personal AI agent. Its signed-in application was not
accessible. The checklist below covers capabilities documented in accessible
official sources; it is not a claim of exhaustive account-specific entitlement.
Screenshots or documentation from additional signed-in features can extend it.

Official reference sources:

- **P**: https://muse.ai/?return_to=/platform — current product page.
- **D**: https://introducing.muse.ai/ — September 2026 product design description.
- **S**: https://security.muse.ai/ — security architecture and platform description.
- **C**: https://muse.ai/platform/docs — connector capabilities and permission rules.
- **M**: https://ai.meta.com/muse/ — official product overview (indexed public content).
- **B**: https://muse.ai/business — small-business offering.

Status: **Implemented** means executable source exists, not that external services
or the Electron UI were live-tested. **Partial** means a working subset.
**External** requires an account/service/infrastructure beyond this repository.
**Not implemented** remains part of the target; there are no placeholder controls
claiming these operations succeed. Testing evidence is in `TESTING.md`.

| Muse capability | Source | Nagol equivalent and current status | Dependencies / parity limits |
| --- | --- | --- | --- |
| Conversational assistant | P,D | Implemented: persistent text chat | User-selected text model; contract-tested only |
| Main conversation and side chats | D | Implemented: Home and separate chats | A single run per chat; different chats can run concurrently |
| Persistent memory | D | Implemented: readable/editable memory | Explicit user/approved tool edits, no automatic memory extraction |
| Personal name, avatar, style | D | Partial: name, initials/emoji, personality, themes | No generated animated avatar system |
| Multi-step task execution | P,D | Implemented: bounded tool loop | JSON-following model; 10 steps per run; no hidden retries |
| Multiple simultaneous tasks | D,S | Partial: independent side-chat runs | No automatic swarm of delegated subagents |
| Goals and plans | D | Implemented: goal plans, completion, context | No automatic progress inference without a prompted task |
| Ideas and personalized suggestions | D | Partial: starter prompts and model-generated advice | No autonomous Ideas feed or ranking |
| Background work | D | Partial: running tasks continue in tray | Requires awake PC and running app; no hosted always-on worker |
| Scheduled follow-ups / reminders | D,M | Implemented: persistent schedules and notifications | OS notifications unverified; no mobile push |
| Event-driven monitoring | D | Partial: scheduled AI checks | No inbound webhook/event bus; approvals still required |
| Research and web search | D,M | Implemented: Bing research browser and static HTTPS reader | Internet required; browser UI/live sites unverified; sites may block automation |
| Full browser and user takeover | P,S | Partial: separate visible Chromium research window | Agent can navigate/read; user can interact manually |
| Form filling, bookings, shopping | P,D | Not implemented as autonomous browser actions | Research results may inform user action; no booking success is synthesized |
| Sending emails | P,C | External: possible via configured MCP mail tool | Native Gmail/Outlook OAuth absent; must test actual connector and approval flow |
| Calendar management | P,C | Partial: local reminders and ICS export; MCP extension | No native Google/Microsoft read/write sync |
| Connected apps and social services | P,S | Partial: generic MCP client | Trusted server required; no bundled Instagram/Facebook/car/home integrations |
| Custom connectors / tools | D,S | Partial: discover and invoke MCP tools | JSON-response HTTP + bearer auth only; OAuth, SSE-only, stdio and marketplace absent |
| Connector discovery marketplace | C | Not implemented | Locally configured connectors only, no public review/hosting infrastructure |
| Filesystem workspace | D,S | Implemented: bounded local workspace and text files | Agent has no arbitrary host filesystem access |
| Terminal and code execution | D,S | Partial: isolated short Python runs | Docker Desktop and pre-pulled Python image; no general shell/compiler environment |
| Documents and PDFs | D | Partial: text/Markdown/CSV/HTML creation, plain-text PDF export | No native DOCX/PPTX/XLSX composition; PDF runtime unverified |
| Web pages and interactive artifacts | D | Partial: real HTML/CSS/JS source creation/export | No in-app executable preview or hosted publishing; source is never auto-executed |
| Image generation | M | Implemented: explicit OpenAI/Gemini/compatible image model | Account/model support needed; base64 PNG/JPEG only; live API unverified |
| Dedicated persistent cloud computer | P,S | Not implemented | Local Electron workspace is not a Linux VM; cloud compute/storage has ongoing cost |
| Mobile, Mac, web clients | P,M | Not implemented | Windows selected by user; other clients remain parity target |
| WhatsApp messaging | P,M | Not implemented | Requires authorized messaging integration, hosting, account setup and testing |
| Transparent activity | P,D | Partial: local operation outcomes and approvals | Not a tamper-proof audit trail or full replayable task trace |
| Action approvals | P,D,C | Implemented: immutable one-use pending actions, deny/cancel/expiry | More conservative than Muse; no permanent allow grants |
| Read/write/sensitive permissions | C | Partial: all external actions require approval | No per-service OAuth scopes; external server remains trusted |
| Credential vault | P,S | Implemented for API keys/tokens using Windows encryption | No website credential substitution, password-manager integration, or host-compromise protection |
| Wallet / limited-use payment cards | P,S | Not implemented | Requires approved payment processor integration; do not approximate with card storage |
| Purchase protection / refunds | P,C | External; not provided by Nagol | Provider agreements and actual transactional APIs required |
| Isolated execution and network authority | S | Partial: sandboxed renderer, workspace checks, isolated Python | No kernel-enforced VM isolation, independent Sentinel or egress classifiers |
| Prompt-injection defenses | S | Partial: untrusted-data labeling and deterministic approvals | No trained ensemble; prompt injection remains a risk |
| Continuous backups | S | Partial: atomic saves and manual non-secret export | No cloud backup or automatic restore system |
| Privacy and retention controls | P,S | Partial: local storage, memory/chat deletion, export | Remote model data policies apply; no remote retention-management integration |
| Small-business skills/workflows | B | Partial: goals, research, files and configurable connectors | No dedicated commerce/accounting/CRM packages or promised business outcomes |
| Model customization / BYOK (Nagol requirement) | User | Implemented: OpenAI, Anthropic, Gemini, compatible endpoints, Ollama | Provider-specific support is validated at call time; model names are user supplied |
| Local/open models (Nagol requirement) | User | Implemented: local Ollama with cloud-route rejection | Models downloaded separately; licence and hardware vary |
| Hosted free usage (Nagol requirement) | User | Supported through user accounts where available | No shared credentials or unlimited-free promise |
| GitHub-ready source and packaging | User | Implemented: source, tests, docs, MIT, CI, portable build script | Dependency download and actual Windows build blocked here; repository not uploaded |

The reference also describes **1Password integration, Shop Pay, and Confidential
VM** as forthcoming in the accessed pages. These are not counted as verified
generally available capabilities, and Nagol does not implement them.

## Phases and release gates

1. **Foundation (source implemented):** Windows shell, provider boundaries,
   credentials, local persistence, original interface, tests and documentation.
2. **Useful workflows (source implemented, external verification pending):**
   workspace tools, research, reminders, scheduled runs, images, Docker and MCP.
3. **Desktop preview release (blocked here):** install Electron, generate lockfile,
   execute UI/DPAPI/tray/PDF/browser checks, test real providers, build and launch
   portable executable on a clean Windows machine, then publish a preview.
4. **Extended parity:** native authenticated connectors, artifact preview/export,
   guarded form automation, event listeners, mobile/messaging clients and hosted
   workers. Each remains a tracked requirement, not silently removed scope.
5. **Production release:** reliability and accessibility work, migration/recovery,
   threat-model testing, installer/signing/update system, deployment and support
   policies, load/cost limits, and release QA. Payment protection and a dedicated
   hosted VM cannot be reproduced by client code alone.
