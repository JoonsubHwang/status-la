const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');



const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ]
});

let defServer;

client.once('ready', () => {
    console.log('ready');
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isCommand)
        return;

    const { commandName } = interaction;
    
    if (commandName === 'setserver') {
        defServer = interaction.options.getString('servername');
        await interaction.reply(`Server set to **${defServer}**.`);
    }
    else if (commandName === 'server') {
        await interaction.reply('Elzowin: g');
    }
    else if (commandName === 'all') {
        await interaction.reply('Elzowin: g \nAvesta: g');
    }
    else if (commandName === 'help') {
        await interaction.reply('\`/setserver <servername>\` Set default server to display. \n\`/server (<servername>)\` Display status of the default or specified server. \n\`/all\` Display status of all servers.');
    }

});

client.login(token);
