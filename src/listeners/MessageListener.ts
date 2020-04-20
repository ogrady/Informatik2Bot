const config = require("../../config.json");
import { Listener } from "discord-akairo"
import * as discord from "discord.js"
import * as bot from "../BotClient"
import * as db from "../DB"
import * as mail from "nodemailer";
import * as crypto from "crypto";
import * as L from "../Locale";

export class MessageListener extends Listener {
    private transporter: mail.Transporter;

    public constructor() {
        super("message", {
            emitter: "client",
            event: "message"
        });

        this.transporter = mail.createTransport({
          host: config.email.host,
          auth: {
            user: config.email.user,
            pass: config.email.pass
          }
        });

        this.transporter.verify((error, success) => {
          if (error) {
            console.error("error", `Error while starting transporter: ${error}.`);
          } else {
            console.log("info", "Server is ready to receive email messages.");
          }
        });
    }

    private async sendToken(user: discord.User, email: string): Promise<boolean> {
        let res: boolean = false;
        const token: string = crypto.randomBytes(16).toString("hex");
        
        (this.client as bot.BotClient).db.setToken(user, email, token);

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: "[Informatik 2] Discord Token",
            text: L.get("MAIL_TEXT") + token
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log("info", `Email sent: ${info.response}`);
            res = true;
        } catch(error) {
            console.error("error", `Error while sending Email: ${error}`);
            res = false;
        }
        return res;
    }

    private verifyToken(user: discord.User, token: string): boolean {
        const verified: boolean = (this.client as bot.BotClient).db.verifyToken(user, token);
        if(verified) {
            const roleName = config.roles.auth;
            this.client.guilds.cache.map(g => {
                const member: discord.GuildMember | undefined = g.members.cache.find(m => m.id === user.id);
                if(member !== undefined) {
                    const role: discord.Role | undefined = g.roles.cache.find(r => r.name === roleName);
                    if(role !== undefined) {
                        member.roles.add(role);
                    } else {
                        console.log("warning", `Found common server ${g.name} with verified user ${user.username}, but the auth role '${roleName}' does not exist there. Skipping role assignment on that server.`);
                    }
                }
            })
        }
        return verified;
    }

    public async exec(message: discord.Message): Promise<void> {
        if(message.channel instanceof discord.TextChannel) return; // only interested in direct messages
        if(message.author.id === this.client.user?.id) return; // don't react to own messages...

        const studentMail: RegExpMatchArray | null = message.content.match(/^(.+)\.(.+)@student\.uni-tuebingen\.de$/);
        const token: RegExpMatchArray | null = message.content.match(/^(\w|\d)+$/);

        if(studentMail) {
            // user sent a student mail
            this.sendToken(message.author, studentMail[0]);
            console.log("info", `Sent token to user ${message.author.username} on their email ${studentMail[0]}.`)
            message.reply(L.get("TOKEN_SENT"))
        } else if(message.content.match(/^.+@.+\..+$/)) {
            // user sent a non-student mail 
            console.log("info", `User ${message.author.username} tried to register with non-student mail ${message.content}.`)
            message.reply(L.get("EMAIL_MALFORMED"));
        } else if(token) {
            // user sent a token
            console.log("info", `User ${message.author.username} sent a token token ${token[0]}.`)
            const verified = this.verifyToken(message.author, token[0]);
            message.reply(L.get(verified ? "TOKEN_ACCEPTED" : "TOKEN_REJECTED"));
        } else {
            // user sent anything that is not recognised
            console.log("info", `User ${message.author.username} sent incomprehensible message ${message.content}.`)
            message.reply(L.get("INCOMPREHENSIBLE"));    
        }
    }
}

module.exports = MessageListener;