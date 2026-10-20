# Nagol 0.1.0 developer preview

Initial independent Windows desktop AI workspace: configurable local/cloud
models, persistent conversations, editable memory, goals, reminders, scheduled
agent tasks, explicit approvals, research browser, workspace files, image model
adapter, Docker-isolated Python, MCP tool support, and portable build automation.

This is a developer preview, not full Muse feature parity or a production-ready
release. Provider adapters have contract tests; live accounts and Electron OS
integrations require validation on the release builder. Consult `FEATURES.md`
and `TESTING.md` for the exact boundary.

No hosted VM, mobile/WhatsApp client, wallet, autonomous form submissions, native
email/calendar OAuth, or guaranteed purchases are provided. No shared keys or
model weights are bundled. All cloud use is selected by the user; no automatic
fallback occurs. Provider charges, quotas and data policies apply.

A portable executable must be built and smoke-tested before attaching it to this
release. If only source is attached, do not claim an executable is included.
