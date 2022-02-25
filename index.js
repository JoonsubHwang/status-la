const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');



const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ]
});

const updateInterval = 30 * 1000; // 30 sec
let defServer;
let statuses = { // TODO: remove mockup data
    Azena:      'Azena',
    Una:        'Una',
    Regulus:    'Regulus',
    Avesta:     'Avesta',
    Galatur:    'Galatur',
    Karta:      'Karta',
    Ladon:      'Ladon',
    Kharmine:   'Kharmine',
    Elzowin:    'Elzowin', 
    Sasha:      'Sasha', 
    Adrinne:    'Adrinne', 
    Aldebaran:  'Aldebaran', 
    Zosma:      'Zosma', 
    Vykas:      'Vykas', 
    Danube:     'Danube',
}

client.once('ready', () => {
    console.log('ready');
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isCommand)
        return;

    const { commandName } = interaction;
    
    if (commandName === 'setserver') {

        defServer = interaction.options.getString('servername');

        setNickname(interaction);

        setInterval(() => {
            setNickname(interaction);
        }, updateInterval)

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

function setNickname(interaction) {
    const status = statuses[defServer];
    const icon = '✅';
    const serverName = defServer.slice(0, 4) + (defServer.length > 4 ? '.' : '');
    interaction.guild.me.setNickname(`${icon} ${serverName} - ${status}`);
}

client.login(token);
