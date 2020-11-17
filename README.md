# Informatik 2 Discord Bot
## Purpose
Automatic verfication of users through email tokens.

## Setup
1. Crate a new bot user and invite it to your server. See [this tutorial for creating a bot](https://discordpy.readthedocs.io/en/latest/discord.html) on how to do that and how to acquire your token needed for step 2.
2. Copy `config.json.example` to `config.json` and adjust values to your needs. 
3. Install all dependencies (`npm install` from the root directory). 
4. Transpile from TypeScript to JavaScript (`tsc` from the root directory, if you have it installed globally).
5. Run using `node built/index.js`
