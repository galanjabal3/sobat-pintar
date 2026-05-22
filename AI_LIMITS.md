# AI Limits

This project uses conservative per-feature limits so Gemini requests stay predictable, cheap, and easy to validate.

## Input limits

| Feature | Max input | Notes |
|---|---:|---|
| Chat | 2000 characters | User message only |
| Explain | 3000 characters | Question text; image input stays supported |
| Summary | 8000 characters | Raw text pasted by user |
| Practice | 120 characters | Subject name |
| Schedule | 8 subjects | Each subject up to 120 characters |

## Output limits

| Feature | Max output tokens | Notes |
|---|---:|---|
| Chat | 640 | Short, helpful reply |
| Explain | 2400 | Step-by-step explanation with enough room for complete answers; retries once with more room if Gemini reaches the token cap |
| Summary | 2000 | Compact bullets + conclusion; retries once with more room if Gemini reaches the token cap |
| Practice | 3200 | Five-question JSON response |
| Schedule | 2200 | JSON schedule response, capped to 7 days and retried with more room if needed |

## Daily quota per user

| Feature | Limit | Scope |
|---|---:|---|
| Chat | 5 requests/day | Per user |
| Explain | 2 requests/day | Per user |
| Summary | 1 request/day | Per user |
| Practice | 2 requests/day | Per user |
| Schedule | 1 request/day | Per user |

## Behavior

- Backend is the source of truth for enforcement.
- Frontend mirrors the same input caps for better UX.
- UI shows remaining daily quota for active AI features.
- Chat history is trimmed before being sent to Gemini so the prompt does not grow without bound.
- Practice and schedule responses are requested as JSON schemas and the backend can recover fenced JSON blocks.
- Practice and schedule retry once on parse failures to reduce flaky 500s.
- Transient Gemini 503/UNAVAILABLE responses are retried briefly before failing.
- Daily quota is stored in `ai_usage_quotas` and resets automatically each day.
