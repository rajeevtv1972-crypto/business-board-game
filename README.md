# Desi Tycoon

An original Indian-themed property-trading browser game.

## Play locally

Open `index.html` in a modern browser. No build tools are needed for local play.

## Features

- Local pass-and-play for 2–4 seats
- Optional AI opponents
- City-property purchases, rent, auctions, cards, buildings, mortgages, trades and jail
- Portfolio dashboard, leaderboard, match statistics and local save/resume
- Online room-code multiplayer backed by Cloudflare Durable Objects (requires Worker deployment)

## Deploy the online version to Cloudflare Workers

The online room server and static game are deployed together as one Worker. Use a recent Node.js installation and run these commands from the repository folder:

```bash
npm install -D wrangler
npx wrangler login
npx wrangler deploy
```

The `wrangler.toml` file configures the Worker, static assets, and SQLite-backed Durable Object room class. The first deployment creates the Durable Object migration. Confirm the resulting Worker URL matches the game's public URL; the client connects to `/api/room/ROOMCODE` on the same origin.

If the existing `business-board-game.max-speed.workers.dev` Worker is managed by a separate dashboard configuration, make sure this repo's `wrangler.toml` deployment targets that same Worker name/account before deploying. Do not deploy a second Worker and expect the existing public URL to change automatically.

## Use online rooms

1. Open the deployed game and enter a display name.
2. Click **Create room** and share the invite link or room code.
3. Friends open the same game URL, enter the code, and click **Join room**.
4. The host starts a match; connected browsers receive shared game-state updates.

Online play is an early implementation. Keep the room code private to the intended players. It currently synchronizes browser game snapshots rather than enforcing a fully server-authoritative rules engine, so it should be play-tested before relying on it for competitive matches.

## Important limitations

This is a playable prototype, not a complete rule-accurate game. Auction, debt, and bankruptcy workflows are simplified. Prices and gameplay values are illustrative.

## Original work

The UI, board layout, and artwork are original and do not include assets from the commercial game that inspired the concept.

## Android APK

This repository can build an Android app that bundles the complete game UI for local play and connects to the deployed Cloudflare Worker for online room multiplayer.

### Download the APK

1. Open the repository's **Actions** tab.
2. Select **Build Chiranth's Business Android APK**.
3. Open the latest successful run.
4. Download the \`chiranths-business-android-apk\` artifact and extract \`app-debug.apk\`.
5. Transfer it to your Android phone and install it. Android may ask you to allow installation from that source.

The workflow runs automatically when game files or Android build configuration change. You can also run it manually with **Actions → Build Chiranth's Business Android APK → Run workflow**. Artifacts are retained for 14 days.

This is a debug/sideload APK for personal testing, not a Play Store release. A Play Store release needs a release build signed with a private release key.

### Build on your own computer

Install Node.js 22+, Java 21, and Android Studio with Android SDK API 36. In the repository folder, run:

\`\`\`bash
npm install
npx cap add android
npx cap sync android
npx cap open android
\`\`\`

Then use Android Studio to build or run the app.

