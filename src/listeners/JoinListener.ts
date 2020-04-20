import { Listener } from "discord-akairo"
import * as discord from "discord.js"
import * as bot from "../BotClient"
import * as L from "../Locale";

export class JoinListener extends Listener {
    constructor() {
        super("JoinListener", {
            emitter: "client",
            event: "guildMemberAdd"
        });
    }

    exec(member: discord.GuildMember): void {
        if(!member.user.bot) {
            member.send(L.get("WELCOME"));
        }
    }
}

module.exports = JoinListener;