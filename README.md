# Desi Tycoon

An original, Indian-themed property-trading board-game prototype built as a single-page browser game.

## Play locally

Open `index.html` in a modern browser. No build tools or dependencies are required.

## Current prototype

- Local pass-and-play for 2–4 players
- City-property purchases and rent
- Auctions with manual bidding
- Chance and Community Chest cards
- Colour-group building, selling buildings, mortgages and redemption
- Basic trades, jail, and bankruptcy flow

## Important limitations

This is an early playable prototype, not a complete rule-accurate game. The current implementation has simplified auction and debt workflows; test game rules carefully. Multiplayer across devices, online accounts, persistent game saves, and server-authoritative play are not implemented yet. Property prices and gameplay values are illustrative.

## Deploy

This is a static site. In Cloudflare Pages, import this GitHub repository and use the following settings:

- Framework preset: None
- Build command: leave blank
- Build output directory: `/` (repository root)

The site entry point is `index.html`.

## Original work

The UI, board layout, and artwork are original and do not include assets from the commercial game that inspired the rule research.
