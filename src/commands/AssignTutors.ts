import * as db from '../DB';
import * as discord from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';

const OUT_DIR = '/tmp/';
const SEPARATOR = ',';
const GROUP_PREFIX = 'Tutorium';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tutassign')
        .addAttachmentOption(option => option
            .setName('assignments')
            .setDescription(`csv file containing "email, groupname" per line, separated by ${SEPARATOR}`)
            .setRequired(true)
        ),
    async execute(interaction: discord.Interaction) {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.guild === null) return interaction.reply('Use command in guild');

        await interaction.deferReply();

        const url = interaction.options.getAttachment('assignments')!.url;

        try {
            const download = await fetch(url);
            const output = await download.text();

            for (const line of output.split('\n')) {
                const tok = line.split(SEPARATOR);
                if(tok.length !== 2) {
                    console.error(`Invalid format in line (expected "email address${SEPARATOR}group". Skipping ${line}`);
                } else {
                    const [email, group] = tok.map(t => t.trim());
                    const role: discord.Role | undefined = interaction.guild?.roles.cache.find(r => r.name === group);

                    if(role === undefined) {
                        console.error('ERROR', `Was supposed to assign group with name '${group}' to user with email '${email}'. But no such role exists. Skipping assignment for them.`);
                    }
                    else {
                        const dbentry: db.User | undefined = this.getClient().db.findUser(email);

                        if(dbentry === undefined) {
                            console.error('WARNING', `Could not find a database entry for registered user ${email}. Skipping assignment for them.`);
                        } else {
                            try {
                                const member: discord.GuildMember | undefined = await interaction.guild?.members.fetch(dbentry.discord_user);

                                if(member === undefined) {
                                    console.error('WARNING', `User with email ${email} is no longer part of the guild. Skipping assignment for them.`);
                                } else {
                                    member.roles.cache
                                        .filter(r => r.name.startsWith(GROUP_PREFIX) && r.name !== group)
                                        .map(r => { console.log('removing ' + r.name); member.roles.remove(r); }); // remove all groups that are not the one we are currently assigning, in case this is a re-assignment.
                                    await member.roles.add(role);
                                    console.log('INFO', `Successfully assigned group '${group}' to user ${member.displayName} (${email})`);
                                }
                            } catch(e) {
                                console.error(`Error while fetching ${dbentry.discord_user} for ${email}: ${e}.`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`Error while trying to retrieve ${url}: ${err}`);
        }
    }
};