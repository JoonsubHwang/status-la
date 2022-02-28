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
    nae: {
        azena:      undefined,
        una:        undefined,
        regulus:    undefined,
        avesta:     undefined,
        galatur:    undefined,
        karta:      undefined,
        ladon:      undefined,
        kharmine:   undefined,
        elzowin:    undefined, 
        sasha:      undefined, 
        adrinne:    undefined, 
        aldebaran:  undefined, 
        zosma:      undefined, 
        vykas:      undefined, 
        danube:     undefined,
    },
    naw: { 
        mari:       undefined,
        valtan:     undefined,
        enviska:    undefined,
        akkan:      undefined,
        bergstrom:  undefined,
        shandi:     undefined,
        rohendel:   undefined,
    },
    euc: { 
        neria:      undefined,
        kadan:      undefined,
        trixion:    undefined,
        calvasus:   undefined,
        thirain:    undefined,
        zinnervale: undefined,
        asta:       undefined,
        wei:        undefined,
        slen:       undefined, 
        sceptrum:   undefined, 
        procyon:    undefined, 
        beatrice:   undefined, 
        inanna:     undefined, 
        thaemine:   undefined, 
        sirius:     undefined, 
        antares:    undefined, 
        brelshaza:  undefined, 
        nineveh:    undefined, 
        mokoko:     undefined, 
    },
    euw: { 
        rethramis:  undefined,
        tortoyk:    undefined,
        moonkeep:   undefined,
        stonehearth:undefined,
        shadespire: undefined,
        tragon:     undefined,
        petrania:   undefined,
        punika:     undefined,
    },
    sa: { 
        kazeros:    undefined,
        arcturus:   undefined,
        gienah:     undefined,
        arcturus:   undefined,
        yorn:       undefined,
        feiton:     undefined,
        vern:       undefined,
        kurzan:     undefined,
        prideholme: undefined,
    },
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

            const serverName = interaction.options.getString('servername').toLowerCase();

            if (isValidServer(serverName)) {
                
                defServer = serverName;

                setInterval(() => {
                    setNickname(interaction);
                }, updateInterval)
    
                await setNickname(interaction);
    
                await interaction.reply(`Server is set to **${capitalize(defServer)}**.`);

            }
            else {
                await interaction.reply(`❌ Error: **${capitalize(defServer)}** server does not exist.`);
            }

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
            for (const zone in statuses)
                for (const serverName in statuses[zone]) {
                    const status = statuses[zone][serverName];
                    allStatuses += `${icons[status]} ${capitalize(serverName)} - ${capitalize(status)}\n`;
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

        const prevStatus = (statuses[defServer] !== undefined) ? statuses[defServer] : null; // TODO capitalize

        await fetchStatuses();

        const status = statuses[defServer]; // TODO capitalize
        const icon = icons[statuses[defServer]];

        if (notify && (prevStatus !== null))
            if (prevStatus !== status)
                interaction.channel.send(`${defServer}: ${icons[prevStatus.toLowerCase()]} ${prevStatus} ➜ ${icon} ${status}`) // TODO capitalize
        const serverName = defServer.slice(0, 4) + (defServer.length > 4 ? '.' : ''); // TODO capitalize

        interaction.guild.me.setNickname(`${icon} ${serverName} - ${status}`); // TODO capitalize

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
            const serverName = $(serverNameClass).text().trim().toLowerCase();
            let status;

            for (const stat in statusList)
                if (($(statusClass+statusList[stat]).html()) !== null)
                    status = statusList[stat];

            for (const zone in statuses)
                if (statuses[zone].hasOwnProperty(serverName))
                    statuses[zone][serverName] = status;
        });

    } catch (error) {
        console.error(`[fetchStatuses] Failed to fetch from ${url}`);
        throw error;
    }

}

function isValidServer(serverName) {

    for (const zone in statuses)
        if (statuses[zone].hasOwnProperty(serverName))
            return true;

    return false;
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

client.login(token);
