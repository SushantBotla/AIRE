# AIRE — MLH technical interview guide

This is a preparation aid, **not** a substitute for understanding the code. Only claim work you personally contributed.

## Two-minute product walkthrough
1. Start with the user problem: property browsing involves manually comparing prices, location, and bedroom counts.
2. Show AIRE's React landing page, property cards, and chat panel.
3. Ask: `3 bed Dallas home under $400k`; explain how the message is sent to `POST /api/recommend`.
4. Open a recommended card and explain how the detail component receives its data.
5. Use **View more** and explain how the frontend passes already-shown IDs to avoid duplicates.

## System design

`App.tsx` owns application state: current message input, conversation history, selected property, loading state, and featured results. The original HackUTD version queried Supabase and called Gemini from the browser. This refactor moves AI requests behind a server endpoint and ships a historical sample data snapshot so reviewers can reproduce the demo without private infrastructure.

`api/recommend.ts` validates the request, ranks the bundled listings by optional price and bedroom preferences, and excludes properties already shown. When `GEMINI_API_KEY` is configured, `api/ai.ts` can ask Gemini to select IDs from the catalog. Returned IDs are checked against the actual data, ensuring the client receives known properties. If AI fails, a deterministic fallback keeps the demo operational.

## Interview questions to prepare

- Why use React state instead of global state or a state-management library?
- How do you guard against duplicate submissions and stale network responses?
- How does the app handle malformed AI output, API failures, and empty results?
- What trust boundary exists between model-generated recommendations and authoritative listing data?
- Why should an API key never be bundled into client-side JavaScript?
- How would you improve tests for max-price filters and partial matches?
- What should happen when the catalog grows from 7 listings to thousands?
- How would you validate listing freshness, provenance, and image licensing?
- What were the tradeoffs of building during a hackathon?

## Limitations worth acknowledging

- Static sample listings, not a live real estate feed.
- Local ranking is simple and not an appraiser or professional recommendation system.
- AIRE does not provide current listing status, mortgage quotes, or actual market valuations.
- Existing property prices and external URLs may be outdated.
- Original project was a collaboration. Know precisely which source files and design choices were yours.

## Before a real interview

- Run `npm install`, `npm test`, and `npm run dev`.
- Verify that property cards, chat, details, and **View more** behave as expected.
- Rotate any formerly committed API keys.
- Fill in your own actual contribution summary; do not attribute teammate or tool-generated code to yourself.
