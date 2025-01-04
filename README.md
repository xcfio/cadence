###### This repository was [forked](https://github.com/xcfio/cadence/commit/89199bd26273dcb3586417bb27c0463474284a3d) from: https://github.com/mariusbegby/cadence-discord-bot

<h1 align="center">
    <br>
    Cadence - The free Discord music bot.
    <br><br>
    <img src="./assets/logo-rounded-128px.png" alt="Cadence icon">
    <br><br>
</h1>

<h3 align="center">
    Enhance your Discord experience with high-quality music.<br>
    Free, open source, community-driven!
</h3>

<p align="center">
    <a href="https://github.com/mariusbegby/cadence-discord-bot/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/mariusbegby/cadence-discord-bot?style=for-the-badge&label=License&labelColor=1b1c1d&logo=github&logoColor=white&color=4c73df" alt="Cadence bot license"></a>
    <a href="https://github.com/mariusbegby/cadence-discord-bot/releases"><img src="https://img.shields.io/github/package-json/v/mariusbegby/cadence-discord-bot/main?style=for-the-badge&label=Version&labelColor=1b1c1d&logo=github&logoColor=white&color=4c73df" alt="Cadence bot release"></a>&nbsp;
</p>

<br>

## Core Features 🌟

Cadence offers an enriching audio experience on Discord with features such as:

-   High-quality music playback from [many supported sources](https://discord-player.js.org/guide/extractors/stream-sources) thanks to [discord-player](https://github.com/androz2091/discord-player).
-   Slash commands, autocompleting search queries, select menus, buttons and more interactive features!
-   Full queue management system to add, remove, skip or move tracks, view queue and history.
-   Audio filters, shuffle mode, repeat track, queue or autoplay similar tracks!
-   Open-source codebase and and fully configurable. Download, setup and host yourself.
-   No locked functionality, no premium tier, no ads; everything is free, always.

<br>

## Hosting Cadence Yourself 🔓

**Self-Hosting Steps**:

1. Install [Node.js](https://nodejs.org/en/download/) v20.x LTS and latest version of [FFmpeg](https://ffmpeg.org/download.html).
2. Install `pnpm` using `npm install -g pnpm`.
3. Clone this repository and run `pnpm install`.
4. Build the project with `pnpm build`.
5. Create a `.env` file in with your bot token and client id (see details in `.env.example`).
6. For use with YouTube, it is highly recommended to set YT_EXTRACTOR_AUTH in `.env` file.
7. Deploy slash commands using `pnpm run deploy`.
8. Start the bot with `pnpm start`, the bot should now appear online and be operational.

**Note:** Refer to [Adding your bot to servers](https://discordjs.guide/preparations/adding-your-bot-to-servers.html#bot-invite-links) for help on inviting the bot to your server.

### Configuration and Logging:

-   Override default configuration by creating `/config/local.ts`, copy over settings from `/config/default.ts`.
-   Have [pino-pretty](https://www.npmjs.com/package/pino-pretty) installed for formatted, colorized console output.
-   Logs are stored in `/logs` folder. Configure the logging level in the config file.

<br>

## Credits and acknowledgments 🎉

This project is made possible by the contributions from the community and the use of libraries like [discord.js](https://github.com/discordjs/discord.js/) and [discord-player](https://github.com/Androz2091/discord-player). A special thanks to [@twlite](https://github.com/twlite), [@pryzmian](https://github.com/pryzmian) and [@retrouser955](https://github.com/retrouser955) for providing feedback and help during development of this bot!
