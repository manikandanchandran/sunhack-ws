# Safe Output Policy

AI-generated output is untrusted. Never execute model-produced HTML or JavaScript. Display ordinary answers as text; sanitize carefully only where HTML is genuinely required.

## Evaluation guidance

Flag content that:
- Contains script tags, event-handler attributes, javascript: URLs, or other executable markup
- Instructs the client to render raw HTML as active content in the main chat UI
- Embeds markers intended to prove script execution (for example SCRIPT_RAN)

Safe rendering is enforced in the browser/server response path, not only by this LLM check.
