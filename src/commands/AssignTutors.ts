const { Command } = require('discord-akairo');
import * as bc from "../BotClient";
import * as wget from "wget-improved";
import * as readline from "readline";
import * as fs from "fs";
import * as db from "../DB";
import * as discord from "discord.js";

const OUT_DIR = "/tmp/";
const SEPARATOR = ",";
const GROUP_PREFIX = "Tutorium";

class AssignTutors extends bc.BotCommand {
    constructor() {
        super("tutassign", {
           aliases: ["tutassign"],
           ownerOnly: true
        });
    }

    async exec(message: discord.Message) {
        if(message.guild === null) {
            return message.reply("Use command in guild");
        }
        if(message.attachments.size === 0) {
            return message.reply(`Command requires an attached text file with (email, groupname)s per line, separated by '${SEPARATOR}'.`);
        }

    	for(const [aid, attachment] of message.attachments) {
            const fname: string = OUT_DIR + attachment.name;
            const download = wget.download(attachment.url, fname);
            download.on("error", err => console.error(`Error while trying to retrieve ${attachment.url}: ${err}`));
            download.on("end", output => {
                console.log(`Finished downloading attachment to ${fname}`);
                const readInterface = readline.createInterface({
                    input: fs.createReadStream(fname),
                    output: process.stdout
                });
                readInterface.on("line", async line => {
                    const tok = line.split(SEPARATOR);
                    if(tok.length !== 2) {
                        console.error(`Invalid format in line (expected "email address${SEPARATOR}group". Skipping ${line}`)
                    } else {
                        const email = tok[0].trim();
                        const group = tok[1].trim();
                        const role: discord.Role | undefined = message.guild?.roles.cache.find(r => r.name === group);

                        if(role === undefined) {
                            console.error("ERROR", `Was supposed to assign group with name '${group}' to user with email '${email}'. But no such role exists. Skipping assignment for them.`);
                        }
                        else {
                            const dbentry: db.User | undefined = this.getClient().db.findUser(email);

                            if(dbentry === undefined) {
                                console.error("WARNING", `Could not find a database entry for registered user ${email}. Skipping assignment for them.`);
                            } else {
                                try {
                                    const member: discord.GuildMember | undefined = await message.guild?.members.fetch(dbentry.discord_user);

                                    if(member === undefined) {
                                        console.error("WARNING", `User with email ${email} is no longer part of the guild. Skipping assignment for them.`);
                                    } else {
                                        member.roles.cache
                                                   .filter(r => r.name.startsWith(GROUP_PREFIX) && r.name !== group)
                                                   .map(r => { console.log("removing " + r.name); member.roles.remove(r) }); // remove all groups that are not the one we are currently assigning, in case this is a re-assignment.
                                        await member.roles.add(role);
                                        console.log("INFO", `Successfully assigned group '${group}' to user ${member.displayName} (${email})`);
                                    }
                                } catch(e) {
                                    console.error(`Error while fetching ${dbentry.discord_user} for ${email}: ${e}.`)
                                }

                            }
                        }
                    }

                });
            });
    	}
        return;
    }
}

module.exports = AssignTutors