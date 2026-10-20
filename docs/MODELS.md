# Providers, local inference and licensing

| Option | API implementation | Requirements and limits |
| --- | --- | --- |
| OpenAI | `/v1/chat/completions`, optional `/images/generations` | Own API account/key; text-chat-compatible model; image model set separately |
| Anthropic | `/v1/messages` | Own API account/key; text only in this adapter |
| Google Gemini | `/v1beta/models/{id}:generateContent` | Own key; model/region quotas; optional image-capable model |
| Custom | OpenAI-compatible Chat Completions | HTTPS, or HTTP loopback; compatibility differs between services |
| Ollama local | `/api/show`, `/api/chat`, `/api/tags` | Running loopback runtime and downloaded local model; remote/cloud model routes rejected |

Discovery lists returned model IDs, not a universal capability guarantee. The
connection test makes a real minimal text-generation call. Models without the
expected text API return an actionable error; no provider substitution occurs.
Agent mode is an explicit structured-action option, not a claim that every model
supports accurate planning. Images require a separately entered image model on
the current provider. OpenAI-compatible image servers must return `b64_json`;
Gemini must return PNG/JPEG `inlineData`. Remote image URLs are not auto-fetched.
Audio, video, vision attachments, embeddings and native tool streaming are not
implemented. Model output and request size are bounded.

## Four distinct concepts

**Open-source software**: the application/runtime code has a licence permitting
specified reuse and modification. Nagol's original code is MIT. Ollama's runtime
licence does not determine a model's licence.

**Open-weight model**: weights can be downloaded, but the accompanying licence
may impose conditions and may not meet an open-source definition. Check the exact
model variant and source licence, including commercial redistribution terms.

**Local inference**: computation occurs on your hardware. It avoids a per-request
cloud inference bill but still uses storage, electricity and computing resources.
A local URL alone is not proof: a runtime can proxy cloud models. Nagol rejects
Ollama cloud-labelled models and remote routing metadata before sending prompts;
you remain responsible for the trustworthiness of the local server binary.

**Hosted free allowance**: a service may give limited free usage subject to model,
account, location and rate limits. It may apply different data-use terms. Gemini's
official pricing page currently lists a free tier for selected models. This is
not unlimited hosting, an open-weight licence, or a promise about future pricing.

## Practical local setup

`qwen3:4b` is an example small model listed by Ollama. Review its linked model
licence before use. For a small quantized model, 8–16 GB system RAM and several GB
of free disk are practical starting estimates, not guaranteed minimums. A GPU can
improve speed; available VRAM, quantization, context length and other applications
change memory requirements. Larger models may require substantially more RAM or
VRAM. CPU-only inference can be slow. Start with a short context and test on the
actual target PC. Model downloads and setup are user-managed.

## Official technical references (reviewed 20 October 2026)

- https://docs.ollama.com/api/chat
- https://docs.ollama.com/api/show
- https://ollama.com/library/qwen3:4b
- https://github.com/ollama/ollama/blob/main/LICENSE
- https://platform.openai.com/docs/api-reference/chat/create
- https://platform.openai.com/docs/api-reference/images/create
- https://docs.anthropic.com/en/api/messages
- https://ai.google.dev/gemini-api/docs/text-generation
- https://ai.google.dev/gemini-api/docs/image-generation
- https://ai.google.dev/gemini-api/docs/pricing

Exact upstream model IDs and terms can change. Use provider discovery and consult
the official model documentation instead of relying on a frozen bundled list.
