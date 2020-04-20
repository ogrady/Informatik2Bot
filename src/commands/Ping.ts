const { Command } = require('discord-akairo');

class PingCommand extends Command {
    constructor() {
        super("ping", {
           aliases: ["ping"] 
        });
    }

    exec(message) {
        return; //return message.reply('Pong!');
    }
}

module.exports = PingCommand;