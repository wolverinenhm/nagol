# Verification report

Date: 20 October 2026. Host: Windows x64; Node.js 24.16.0.

## Executed

`npm.cmd test`: **30 tests; 29 passed, 1 skipped, 0 failed**.

The skipped test attempts to create an actual filesystem junction before checking
workspace rejection. The restricted host returned EPERM for link creation.
Traversal, absolute-path, alternate-stream and reserved-device checks passed.
The actual-junction test remains enabled on hosts permitting link creation.

Tests ran with TEMP/TMP pointing to a dedicated directory inside the writable
workspace. The sandbox's default redirected temporary directory allowed writes
but rejected atomic rename. This test-environment adjustment did not change
application persistence or weaken any application checks.

Coverage includes state persistence/reload and corruption protection; secret-free
snapshots; workspace validation; denied writes; public-network checks; recurring
and one-time scheduling; ICS escaping; immutable one-use approvals and abort;
provider protocol formats, discovery, error handling and no fallback; Ollama cloud
route rejection; explicit image-model selection and format checking; MCP session
and invocation protocol; chat persistence; multi-step observation handling;
denied cloud transmission; fixed-provider schedules/runs; cancellation and loop
limits. Provider/network tests use deterministic fixtures, not live accounts.

`npm.cmd run check`: checks JavaScript/CommonJS syntax and required release files.
This passed again during the retry before source
delivery. No UI rendering assertion is inferred from syntax checks.

## Blocked / not executed

- npm dependency installation: registry.npmjs.org DNS lookup failed (ENOTFOUND).
- Electron runtime installation, actual desktop launch and portable EXE build.
- Visual/UI interaction tests, screen-reader testing, Windows DPAPI, tray,
  notifications, research Chromium, native dialogs and PDF output.
- Real OpenAI, Anthropic, Gemini, Ollama or hosted custom provider requests.
- Live MCP server calls, Docker container execution, and actual image generation.
- Clean-machine install/launch and code signing.
- GitHub Actions execution. At the earlier attempt, the connector had no accessible
  repository or creation API; the attempted browser connection failed.

A UI fixture was prepared during development but no successful browser inspection
occurred. It is not packaged as an application or used to claim features work.

## Run locally

```powershell
npm.cmd test
npm.cmd run check
npm.cmd install
npm.cmd start
```

## Required desktop smoke test before releasing a binary

1. Launch as a standard Windows user. Confirm all six navigation views, keyboard
   focus, window resizing, dark/light themes and long/Unicode content.
2. Save a local Ollama connection; discover models and test text generation. Stop
   Ollama and verify an actionable connection failure with no cloud fallback.
3. Add each intended cloud provider using a disposable/restricted test key.
   Verify key persistence across restart and absence of plaintext in state,
   exports, logs and model context. Test invalid key, invalid model and quota.
4. Deny a cloud prompt and verify that no model request occurs. Approve a prompt;
   change the selected provider while a task runs and confirm its original
   destination remains fixed. Check pending approvals expire/cancel correctly.
5. Create a side chat; exchange messages, export, clear/delete, restart and verify
   persistence. Confirm drafts do not migrate into another conversation.
6. Run an agent task that creates and reads a file, attempts parent traversal,
   and receives a denied write. Check actual filesystem contents and model result.
7. Test one-time/recurring reminders, overdue catch-up, tray close/restore/quit,
   no overlap of scheduled AI runs, and deleted bound-provider failure.
8. Import Unicode text; edit/export it; export a PDF and visually inspect it.
   Generate an image with an authorized test model and inspect the returned file.
9. Search and navigate in research Chromium, read after approval, deny page
   disclosure, navigate during pending approval, and verify a fresh read is needed.
10. Start Docker and test arithmetic, infinite-loop timeout, excessive output,
    denied execution, cancellation, absent image and unavailable daemon.
11. Configure a test MCP server; test discovery, read/write calls, rejection,
    session handling, stale configuration, and uncertain external failure. Never
    test purchases against live payment accounts.
12. Build the portable ZIP, extract on a clean Windows x64 PC, launch Nagol.exe,
    and repeat critical tests without Node installed. Preserve all runtime notices.

Passing mocked contract tests does not establish live API compatibility, model
quality, visual correctness, or production security. Update this report with
actual runtime versions and results when those gates are completed.

## Retry on 20 October 2026

Core tests again passed: 29 passed, 1 skipped, 0 failed. Syntax and release-file checks passed. npm installation again failed with ENOTFOUND. Browser access succeeded and the public repository wolverinenhm/nagol was created. Remote build results must be checked separately from the local checks above.
