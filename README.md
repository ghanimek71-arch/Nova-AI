# Nova AI — PenguinMod Extension

Nova AI is a custom PenguinMod extension that adds AI blocks to projects.

## Planned first version

- Configure the Nova AI service URL.
- Send a prompt and receive an AI response.
- Generate an image from a text prompt and receive its URL.
- Read the latest response and generated image URL with reporter blocks.

## Important security note

The extension must not contain a private AI provider API key. Requests should go through a small backend service that keeps secrets on the server.

## Development

The extension entry point is `nova-ai.js`. Once hosted at a public HTTPS URL, load that URL in PenguinMod as a custom extension.

The backend endpoints expected by this starter extension are:

- `POST /chat` with JSON `{ "prompt": "..." }`, returning `{ "text": "..." }`
- `POST /images` with JSON `{ "prompt": "..." }`, returning `{ "url": "https://..." }`

This repository starts with the extension scaffold; the backend and real AI provider integration are separate next steps.
