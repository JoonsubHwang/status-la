const { Client, Intents } = require('discord.js');


const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ]
});

client.once('ready', () => {
    console.log('ready');
});

// client.on('messageCreate', msg => {

// });

client.login(process.env.TOKEN);
