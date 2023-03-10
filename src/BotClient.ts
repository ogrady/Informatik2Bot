const config = require('../config.json');
import * as db from './DB';
import * as discord from 'discord.js';
import * as path from 'path';
import * as L from './Locale';
import * as fs from 'fs';
import * as mail from 'nodemailer';
import * as crypto from 'crypto';
import { SlashCommandBuilder } from 'discord.js';

interface Config {
    owner_ids: string[];
    prefix: string;
    token: string;
    email: {
        host: string,
        user: string,
        pass: string,
        from: string
    };
    roles: {
        auth: string;
        tutorials: string[]
    }
}

export class BotClient extends discord.Client {
    public readonly config: Config;
    public readonly db: db.Database;
    public readonly cache: Set<string>; // caches input channels, which are unique Snowflakes, to speed up when messages should be discarded
    public readonly commands: discord.Collection<string, { data: SlashCommandBuilder, execute: (interaction: discord.Interaction) => void }>;
    public readonly transporter: mail.Transporter;
    
    private sourceIsOwner(interaction: discord.ChatInputCommandInteraction): boolean {
        return this.config.owner_ids.includes(interaction.member!.user.id);
    }

    private async sendToken(user: discord.User, email: string): Promise<boolean> {
        let res = false;
        const token: string = crypto.randomBytes(16).toString('hex');
        
        this.db.setToken(user, email, token);

        const mailOptions = {
            from: config.email.from,
            to: email,
            subject: '[Informatik 2] Discord Token',
            text: L.get('MAIL_TEXT') + token
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('info', `Email sent: ${info.response}`);
            res = true;
        } catch(error) {
            console.error('error', `Error while sending Email: ${error}`);
            res = false;
        }
        return res;
    }

    private verifyToken(user: discord.User, token: string): boolean {
        const verified: boolean = this.db.verifyToken(user, token);
        if(verified) {
            const roleName = config.roles.auth;
            this.guilds.cache.map(g => {
                console.log('info', `Verifying user ${user.username} on server ${g.name}.`);
                g.members.fetch(user.id)
                    .then((member : discord.GuildMember | undefined) => {
                        if(member !== undefined) {
                            const role: discord.Role | undefined = g.roles.cache.find(r => r.name === roleName);
                            if(role !== undefined) {
                                member.roles.add(role);
                            } else {
                                console.log('warning', `Found common server ${g.name} with verified user ${user.username}, but the auth role '${roleName}' does not exist there. Skipping role assignment on that server.`);
                            }
                        } else {
                            console.log('debug', `Tried to verify user ${user.username} on server ${g.name}, but they do not seem to be a member on that server.`);    
                        }
                    })
                    .catch(error => console.error('error', error)); 
            });
        }
        return verified;
    }

    private async privateMessage(message: discord.Message): Promise<void> {
        const studentMail: RegExpMatchArray | null = message.content.match(/^(.+)\.(.+)@student\.uni-tuebingen\.de$/);
        const token: RegExpMatchArray | null = message.content.match(/^(\w|\d)+$/);

        if(studentMail) {
            // user sent a student mail
            this.sendToken(message.author, studentMail[0]);
            console.log('info', `Sent token to user ${message.author.username} on their email ${studentMail[0]}.`);
            message.reply(L.get('TOKEN_SENT'));
        } else if(message.content.match(/^.+@.+\..+$/)) {
            // user sent a non-student mail 
            console.log('info', `User ${message.author.username} tried to register with non-student mail ${message.content}.`);
            message.reply(L.get('EMAIL_MALFORMED'));
        } else if(token) {
            // user sent a token
            console.log('info', `User ${message.author.username} sent a token ${token[0]}.`);
            const verified = this.verifyToken(message.author, token[0]);
            message.reply(L.get(verified ? 'TOKEN_ACCEPTED' : 'TOKEN_REJECTED'));
        } else {
            // user sent anything that is not recognised
            console.log('info', `User ${message.author.username} sent incomprehensible message ${message.content}.`);
            message.reply(L.get('INCOMPREHENSIBLE'));    
        }
    }

    public async publicMessage(message: discord.Message): Promise<void> {
        if(message.content.match(/if\s*-?\s*(?:(schleife)|(loop))/i)) {
            message.reply(L.get('IF_LOOP'));
        }
    }

    public constructor(options) {
        super(options);
        this.config = options.config;
        this.db = new db.Database();
        this.cache = new Set<string>();
        this.commands = new discord.Collection();
        this.transporter = mail.createTransport({
            host: config.email.host,
            auth: {
                user: config.email.user,
                pass: config.email.pass
            }
        });

        this.transporter.verify((error, success) => {
            if (error) {
                console.error('error', `Error while starting transporter: ${error}. Bot will not be able to send out tokens via mail!`);
            } else {
                console.log('info', 'Server is ready to receive email messages.');
            }
        });

        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.command.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            /* eslint-disable @typescript-eslint/no-var-requires */
            const command = require(filePath);
            this.commands.set(command.data.name, command);
            console.log(`Loaded ${command.data.name} command.`);
        }

        this.on('guildMemberAdd', (member: discord.GuildMember) => {
            if(!member.user.bot) {
                member.send(L.get('WELCOME'));
            }
        });

        this.on('messageCreate', message => {
            if (message.author.id === this.user?.id) return; // don't react to own messages...

            if (message.channel instanceof discord.TextChannel) {
                this.publicMessage(message);
            } else {
                this.privateMessage(message);
            }
        });

        this.on('interactionCreate', async interaction => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);
       
                if (command) {
                    try {
                        // as all commands of this bot are restricted to owners, we can do this check centralised.
                        // If we ever were to allow a more finely-grained permissions system, this had to be put
                        // into the each command.
                        if(this.sourceIsOwner(interaction)) {
                            await command.execute(interaction);
                        } else {
                            await interaction.reply({ content: 'You are not allowed to use this command!', ephemeral: true });    
                        }
                        
                    } catch (error) {
                        console.error(error);
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            }       
        });
    }
}