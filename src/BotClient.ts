const config = require("../config.json")
import * as akairo from "discord-akairo"
import * as db from "./DB"
import * as discord from "discord.js"
import * as https from "https";

export class BotClient extends akairo.AkairoClient {
    public readonly db: db.Database;
    public readonly cache: Set<string>; // caches input channels, which are unique Snowflakes, to speed up when messages should be discarded
    public readonly commandHandler: akairo.CommandHandler;
    public readonly listenerHandler: akairo.ListenerHandler;
    public readonly inhibitorHandler: akairo.InhibitorHandler;
    
    public constructor(options) {
        super(options, {});
        this.db = new db.Database();
        this.cache = new Set<string>();

        this.commandHandler = new akairo.CommandHandler(this, {
            directory: './built/commands/',
            prefix: config.prefix,
            commandUtil: true,
            commandUtilLifetime: 600000
        });
        this.commandHandler.loadAll();

        this.listenerHandler = new akairo.ListenerHandler(this, {
            directory: './built/listeners/'
        });
        this.listenerHandler.loadAll();
        
        this.on("ready", () => {

        });

    }
}

/**
* This is just a wrapper that offers a bit of convenience.
* As it turns out, the client is referenced quite a bit
* as it grants access to the DB and so on and casting
* manually every time just clutters the code a lot.
*/
export class BotCommand extends akairo.Command {
    constructor(id: string, options: akairo.CommandOptions) {
        super(id, options);
    }

    /**
    * @returns the casted bot client.
    */
    public getClient(): BotClient {
        return <BotClient>this.client;
    }
}
