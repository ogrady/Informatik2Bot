const config = require("../config.json")
import { BotClient } from "./BotClient"
import * as sqlite3h from "better-sqlite3-helper";

const dbpath = "./db/sqlite.db";

sqlite3h.default({
  path: dbpath,
  memory: false,
  readonly: false,
  fileMustExist: false, // auto create file
  WAL: true, // automatically enable 'PRAGMA journal_mode = WAL'
  migrate: {  // disable completely by setting `migrate: false`
    force: false, // set to 'last' to automatically reapply the last migration-file
    table: 'migration', // name of the database table that is used to keep track
    migrationsPath: './migrations' // path of the migration-files
  }
});

const client = new BotClient({
    ownerID: config.owner_ids,
    prefix: config.prefix,
    commandDirectory: "./built/commands/",
    listenerDirectory: "./built/listeners/",
    commandUtil: true,
    commandUtilLifetime: 600000
});

function startBot() {
    console.log("Starting up...");
    client.login(config.token);
    console.log("Started up...");
}

startBot();