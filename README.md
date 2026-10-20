# Nagol

A local-first personal AI workspace for Windows. Bring your own model, keep your
workspace on your computer, and approve actions before they happen.

**Status: 0.1.0 developer preview, not a production release or full Muse parity.**
The implementation contains real application logic and provider calls. Live model
accounts and the Electron desktop runtime were unavailable in the authoring
environment. Read [test results](docs/TESTING.md) and the complete
[feature checklist](docs/FEATURES.md) before deciding to deploy it.

Nagol is an independent project. It contains original source and visual design;
it is not affiliated with, endorsed by, or based on Meta's proprietary source.

## Start on Windows

Install Node.js 22 or newer (24 recommended) from https://nodejs.org/. Extract the
source archive, open PowerShell inside the `nagol` folder, then run:

```powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd start
```

Use `npm.cmd` on Windows to avoid PowerShell script execution-policy issues.
Installation needs internet access to the npm registry and Electron distribution.
The tests use only Node's built-in libraries and run without installing Electron.
No API key is necessary to open the app or use local notes, goals, and reminders.
Model-driven features require your configured local runtime or provider account.

## First connection

1. Open **Settings & providers**. Choose Ollama, OpenAI, Anthropic, Gemini, or Custom.
2. Enter a connection name and exact text model ID. Enter your own API key for a
   cloud service. Custom endpoints use the Chat Completions protocol and usually
   end in `/v1`. Official providers use fixed official API endpoints.
3. Save, optionally **Discover models**, and **Test text generation**. A test sends
   a generic short request only, and may incur a small charge.
4. Click **Use** and confirm your selection. The provider badge shows your choice.
5. Use **Chat** for text. Enable structured actions in the provider settings and
   select **Agent** to use tools. Smaller models may need clearer instructions;
   the app does not guarantee that every text model can plan reliably.

Cloud conversations request approval before sending chat history, saved memory,
and goal titles. Workspace reads and website reads have separate approvals.
Running tasks keep a snapshot of their provider; scheduled tasks remain bound to
their selected connection ID. There is no automatic failover.

### Local models

Install Ollama from https://ollama.com/ and run:

```powershell
ollama pull qwen3:4b
ollama serve
```

Skip `serve` when the Ollama tray app is already serving. Add an Ollama connection
at `http://127.0.0.1:11434` with model `qwen3:4b`. This is an example, not a bundled
model. Use another installed local model if preferred. Cloud-routed Ollama models
are rejected in local mode. See [model options and licensing](docs/MODELS.md).

## What you can do

- Keep separate conversations, export them, and edit personal memory.
- Plan goals; schedule one-time/recurring reminders and bounded AI tasks.
- Read approved workspace files, generate documents/code, import/export text,
  and export plain-text documents as PDFs.
- Search with Bing in a separate visible research browser, navigate public HTTPS
  URLs, and share rendered page text/links with the selected model after approval.
- Read static public pages without a browser. Redirects require a fresh URL.
- Generate PNG/JPEG images through an optional explicit image model configured
  on OpenAI, Gemini, or a compatible endpoint. No hidden image-provider switch.
- Execute Python in a disposable Docker container with no network or host mounts.
- Discover and invoke tools on trusted JSON-response Streamable HTTP MCP servers.
- Inspect operational activity and approve or deny exact tool requests.

Examples for Agent mode:

```text
Create a weekly meal-planning template and save it as meal-plan.md.
Search for the official Ollama documentation, read it, and summarize the setup.
Read notes.md, extract the action items, and ask before creating reminders.
Run Python to calculate a compound-growth table for 10 years at 5%.
Generate an image of a quiet library using my configured image model.
```

Before Python execution, install/start Docker Desktop and pull the image yourself:

```powershell
docker pull python:3.12-alpine
```

The app never installs Docker, pulls container images, or executes arbitrary code
directly on the Windows host. The 30-second Python runner is intended for short
calculations; it does not provide terminal access or package installation.

## Data and reminders

Data lives in Electron's per-user app-data directory (normally `%APPDATA%\nagol`).
The authoritative location appears in Workspace through **Open folder**.
API keys and connector tokens use Electron `safeStorage` (Windows DPAPI).
Other local data is not encrypted by Nagol; use Windows account security and disk
encryption where appropriate. Keys are never exposed back to the renderer after
saving and are excluded from backups, model context, and activity records.

Closing the window leaves the app in the system tray. **Tray → Quit** stops it.
The PC must be awake for tasks to run. On restart, overdue reminders fire once;
recurrence advances to the next future occurrence. Cloud work and consequential
tools wait for approvals, which expire after five minutes. Overlapping instances
of one scheduled task are skipped. A scheduled task creates a new conversation.
The app does not install a Windows service or start automatically at login.

Use **Export data backup** for a readable JSON copy of non-secret data. Copy the
workspace folder separately. There is no automated backup restoration UI yet.
When manually restoring `state.json`, quit the app first, retain the version
field, and use only your own trusted backup. Re-enter keys on another Windows
account; encrypted keys are account-bound.

## Build a portable Windows application

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run release:zip
```

The build script runs tests/checks, copies Electron and the application into
`dist/Nagol-win-x64`, and produces `Nagol.exe` there. The archive command creates
`dist/Nagol-0.1.0-windows-x64.zip`. Users extract the whole folder and run
`Nagol.exe`; the adjacent runtime files are required. This is a portable app,
not an MSI/NSIS installer. A fresh output directory is required for each build.

**The source repository does not contain binaries or an installer.**
Dependency downloads were blocked locally, but GitHub's Windows runner successfully
installed Electron and built `Nagol.exe` on 20 October 2026. Check the
[Windows build run](https://github.com/wolverinenhm/nagol/actions)
for the portable ZIP artifact. Extract both the downloaded artifact and its inner
portable ZIP, then run `Nagol.exe` from the full extracted folder. Desktop launch,
live providers, signing, and clean-machine smoke tests remain unverified. This
unsigned developer preview is not a production release or an installer.

Electron is pinned to 44.9.1. A lockfile is deliberately not fabricated: generate
and commit `package-lock.json` after the first successful `npm install`, then
switch CI to `npm ci` for repeatable transitive dependency resolution.

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/main.cjs`, `src/preload.cjs` | Electron lifecycle, narrow IPC, credentials, UI actions |
| `src/browser.cjs` | Separate research browser and fixed read-only page extraction |
| `src/core/` | Providers, persistence, tools, approvals, schedules, MCP, validation |
| `src/renderer/` | Original responsive dark/light interface; no framework dependency |
| `tests/` | Core, provider-contract, and agent-integration tests |
| `scripts/` | Syntax checking, original icon generation, Windows packaging |
| `docs/` | Feature parity, architecture, security, model and release guidance |
| `.github/workflows/ci.yml` | Windows tests and portable packaging |

## GitHub

See [exact publishing steps](docs/GITHUB.md). The project repository is https://github.com/wolverinenhm/nagol. Do not commit local app data, backups, keys,
`node_modules`, or `dist`. Add built archives to GitHub Releases instead.

## Licence

MIT for Nagol's original code. Dependencies, model weights, remote APIs, and
services retain their own licences and terms. See `THIRD_PARTY_NOTICES.md`.
