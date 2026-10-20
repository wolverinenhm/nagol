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

A portable executable was built by GitHub Windows CI on 20 October 2026.
The CI artifact is an unsigned developer preview, not a tested production release
or installer. Desktop smoke tests and live provider validation remain outstanding.
Build records: https://github.com/wolverinenhm/nagol/actions.
