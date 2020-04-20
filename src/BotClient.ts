const config = require("../config.json")
import * as akairo from "discord-akairo"
import * as db from "./DB"
import * as discord from "discord.js"

// Valid attributesthat can be checked.
// This was an algebraic sum type once,
// but since types are erased at runtime
// due to the compilation to untyped JS,
// this is now an enum instead. Sigh.
export enum Attribute {
    UID = "uid",
    UNAME = "uname",
    TEXT = "text",
    CID = "cid",
    CNAME = "cname"
}

export interface Condition {
    readonly attribute: Attribute;
    readonly regex: string;
}

export interface ResolvedBridge {
    readonly bridge_id: number;
    readonly source_guild: discord.Guild;
    readonly source_channel: discord.TextChannel;
    readonly destination_guild: discord.Guild;
    readonly destination_channel: discord.TextChannel;
    readonly condition_id: number;
    readonly attribute: Attribute; 
    readonly regex: string;
}

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

/**
* Utility stuff.
*/
export class Util {
    /**
    * Maximum length a message in Discord may have.
    * Used to chunk messages before sending them when
    * prepending the "header".
    */
    static readonly MAX_MESSAGE_LENGTH: number = 2000;

    /**
    * Generator function that creates
    * an infinite list of numbers,
    * incremented by one.
    */
    static * counter(): Generator {
        let i = 0;
        while(true) {
            yield i++;
        }
    }

    /**
    * Tries to find a TextChannel by a generic predicate. 
    * Discord -- for whatever reason -- puts all their Channels,
    * text, voice, or others, into one big collection.
    * Note that internally Collection.find is used, returning
    * only the first matching channel.
    * @param g: the guild to look for the TextChannel in.
    *           Passing a falsey value for g results in undefined.
    * @param pred: the predicate that TextChannel has to pass.
    * @returns the TextChannel, if a channel passing the predicate was found,
    *          or undefined if no such channel was found or g is falsey.
    */
    static findTextChannel(g: discord.Guild | undefined, pred: (c: discord.TextChannel) => boolean): discord.TextChannel | undefined {
        return g ? <discord.TextChannel>g.channels.cache
                                         .filter(c => c instanceof discord.TextChannel)
                                         .find(pred) 
                 : undefined
    }

    /**
    * Cuts a string into chunks of at most SIZE characters.
    * chunk("123456789", 200) -> [ '123456789' ]
    * chunk("123456789", 2) -> [ '12', '34', '56', '78', '9' ]
    * @param s: the string to chop up.
    * @param size: the maximum length of each chunk. 
    *              Final chunk may be smaller.
    *              Size will be normalised to be at least 1.
    */
    static chunk(s: string, size: number): string[] {
        size = Math.max(1,size);
        const chunks: string[] = [];
        let i: number = 0;
        while(i < s.length) {
            chunks.push(s.substring(i, i + size));
            i += size;
        }
        return chunks;
    }

    private constructor() {}
}