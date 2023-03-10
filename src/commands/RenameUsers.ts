import * as bc from "../BotClient";
import * as discord from "discord.js";
import { SlashCommandBuilder } from 'discord.js'


const OUT_DIR = "/tmp/";
const SEPARATOR = ",";
const GROUP_PREFIX = "Tutorium";


module.exports = {
    data: new SlashCommandBuilder()
        .setName('renameusers')
        .addAttachmentOption(option => option
            .setName('names')
            .setDescription(`text file with "email, username"s per line, separated by '${SEPARATOR}'.`)
            .setRequired(true)
        ),
    async execute(interaction: discord.Interaction) {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.guild === null) return interaction.reply("Use command in guild");

        await interaction.deferReply();

        const guild = interaction.guild;
        const attachment = interaction.options.getAttachment("file")!;
        const url = interaction.options.getAttachment('names')!.url;

        try {
            const download = await fetch(attachment.url);
            const text = await download.text();
            for (const line of text.split('\n')) {
                const tok = line.split(SEPARATOR);
                if(tok.length !== 2) {
                    console.error(`Invalid format in line (expected "email address${SEPARATOR}group". Skipping ${line}`)
                } else {
                    const [email, name] = tok.map(t => t.trim());

                    if(email === undefined || name === undefined) {
                        console.error("ERROR", `Was supposed rename user with email '${email}' to name '${name}'. But at least one of the fields was empty.`);
                    }
                    else {
                        const dusers: string[] = this.getClient().db.getDiscordUserByMail(email);
                        if(dusers.length === 0) {
                            console.error("WARNING", `No user was found with email '${email}' on server ${interaction.guild?.name}. Skipping this entry in the input file.`)
                        }
                        for(const duser of dusers) {
                            const member: discord.GuildMember | undefined = await interaction.guild?.members.fetch(duser);
                            if(member === undefined) {
                                console.error("WARNING", `Was supposed to rename the user attached to email '${email}' with Discord id '${duser}'. But that user is not a member of server ${guild.name}. Maybe they have left already. Skipping this entry.`);
                            } else {
                                const oldName = member.nickname;
                                try {
                                    await member.setNickname(name)
                                    console.log("INFO", `Renamed user ${member.toString()} from '${oldName}' to '${name}'.`)
                                } catch (ex) {
                                    console.error("ERROR", `Renamed user ${member.toString()} from '${oldName}' to '${name}' failed with error: ${ex}.`)
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error while trying to retrieve ${attachment.url}: ${err}`)
        }
    },
}