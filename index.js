const { Client, Intents } = require('discord.js');
const { token } = require('./config.json');
const axios = require('axios');
const cheerio = require('cheerio');



const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ]
});

const updateInterval = 30 * 1000; // 30 sec
let statuses = {
    Azena:      '',
    Una:        '',
    Regulus:    '',
    Avesta:     '',
    Galatur:    '',
    Karta:      '',
    Ladon:      '',
    Kharmine:   '',
    Elzowin:    '', 
    Sasha:      '', 
    Adrinne:    '', 
    Aldebaran:  '', 
    Zosma:      '', 
    Vykas:      '', 
    Danube:     '',
}
const icons = {
    good: '✅',
    busy: '🔥',
    full: '⛔',
    maintenance: '🔧',
}

let defServer, notify = true;

client.once('ready', () => {
    console.log('ready');
});

client.on('interactionCreate', async interaction => {

    if (!interaction.isCommand)
        return;

    const { commandName } = interaction;
    
    if (commandName === 'setserver') {

        try {

            defServer = interaction.options.getString('servername');

            setInterval(() => {
                setNickname(interaction);
            }, updateInterval)

            await setNickname(interaction);

            await interaction.reply(`Server set to **${defServer}**.`);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`Error`);
        }

    }
    else if (commandName === 'server') {
        await interaction.reply('Elzowin: g');
    }
    else if (commandName === 'all') {

        try {
            
            await fetchStatuses();

            let allStatuses = '';
            for (const serverName in statuses) {
                const status = statuses[serverName][0].toUpperCase() + statuses[serverName].slice(1);
                const icon = icons[statuses[serverName]];
                allStatuses += `${icon} ${serverName} - ${status}\n`;
            }

            await interaction.reply(allStatuses);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`Error`);
        }
    }
    else if (commandName === 'help') {
        await interaction.reply('\`/setserver <servername>\` Set default server to display. \n\`/server (<servername>)\` Display status of the default or specified server. \n\`/all\` Display status of all servers.');
    }

});

async function setNickname(interaction) {

    try {

        const prevStatus = statuses[defServer][0].toUpperCase() + statuses[defServer].slice(1);

        await fetchStatuses();

        const status = statuses[defServer][0].toUpperCase() + statuses[defServer].slice(1);
        const icon = icons[statuses[defServer]];

        if (notify && (prevStatus !== ''))
            if (prevStatus !== status)
                interaction.channel.send(`${defServer}: ${icons[prevStatus.toLowerCase()]} ${prevStatus} ➜ ${icon} ${status}`)
        const serverName = defServer.slice(0, 4) + (defServer.length > 4 ? '.' : '');

        interaction.guild.me.setNickname(`${icon} ${serverName} - ${status}`);

    } catch (error) {
        console.error(error.message);
        throw error;    
    }

}

async function fetchStatuses() {

    const zoneClass = '.ags-ServerStatus-content-responses-response';
    const serverClass = zoneClass + '-server';
    const serverNameClass = serverClass + '-name';
    const statusClass = serverClass + '-status--';
    const statusList = {
        good: 'good',
        busy: 'busy',
        full: 'full',
        maintenance: 'maintenance',
    }
    const url = 'https://www.playlostark.com/en-us/support/server-status';


    try {

        let $ = await cheerio.load((await axios(url)).data);

        const servers = $(zoneClass).children(serverClass).toArray();
        servers.forEach(server => {

            let $ = cheerio.load(server);
            const serverName = $(serverNameClass).text().trim();
            let status;

            for (const stat in statusList)
                if (($(statusClass+statusList[stat]).html()) !== null)
                    status = statusList[stat];

            statuses[serverName] = status;
        });

    } catch (error) {
        console.error(`[fetchStatuses] Failed to fetch from ${url}`);
        throw error;
    }

}

client.login(token);
