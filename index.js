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
        name:       'North America East',
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
        name:       'North America West',
        mari:       undefined,
        valtan:     undefined,
        enviska:    undefined,
        akkan:      undefined,
        bergstrom:  undefined,
        shandi:     undefined,
        rohendel:   undefined,
    },
    euc: { 
        name:       'Europe Central',
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
        name:       'Europe West',
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
        name:       'South America',
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
                await interaction.reply(`❌ Error: **${serverName}** server does not exist.`);
            }

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`❌ Error: ` + error.message);
        }

    }
    else if (commandName === 'server') {

        try {
            await fetchStatuses();

            const serverName = interaction.options.getString('servername').toLowerCase();
        
            let status;
            for (const zoneId in statuses)
                if (statuses[zoneId].hasOwnProperty(serverName))
                    status = statuses[zoneId][serverName];

            if (status === undefined)
                await interaction.reply(`❌ Error: **${serverName}** server does not exist.`);
            else
                await interaction.reply(`${icons[status]} **${capitalize(serverName)}** - ${capitalize(status)}`);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`❌ Error: ` + error.message);
        }
    
    }
    else if (commandName === 'zone') {

        try {
            await fetchStatuses();

            const zoneId = interaction.options.getString('zonename').toLowerCase();

            let zoneStatuses = `\n🌎 **${statuses[zoneId].name}**\n`;
            for (const serverName in statuses[zoneId]) {
                if (serverName !== 'name') {
                    const status = statuses[zoneId][serverName];
                    zoneStatuses += `\t${icons[status]} ${capitalize(serverName)} - ${capitalize(status)}\n`;
                }
            }

            await interaction.reply(zoneStatuses);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`❌ Error: ` + error.message);
        }
    }
    else if (commandName === 'all') {

        try {
            await fetchStatuses();

            let allStatuses = '';
            for (const zoneId in statuses) {
                allStatuses += `\n🌎 **${statuses[zoneId].name}**\n`;
                for (const serverName in statuses[zoneId]) {
                    if (serverName !== 'name') {
                        const status = statuses[zoneId][serverName];
                        allStatuses += `\t${icons[status]} ${capitalize(serverName)} - ${capitalize(status)}\n`;
                    }
                }
            }
            await interaction.reply(allStatuses);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`❌ Error: ` + error.message);
        }
    }
    else if (commandName === 'help') {
        await interaction.reply( '\`/setserver <servername>\` Set default server to display. \n'
                                +'\`/update\` Update status of default server. \n'
                                +'\`/server <servername>\` Display status of a specified server. \n'
                                +'\`/zone <zonename>\` Display status of servers in a specified zone. \n'
                                +'\`/all\` Display status of all servers.');
    }

});

async function setNickname(interaction) {

    try {

        const prevStatus = (statuses[defServer] !== undefined) ? statuses[defServer] : null;

        await fetchStatuses();

        let status;
        for (const zone in statuses)
            if (statuses[zone].hasOwnProperty(defServer))
                status = statuses[zone][defServer];

        if (notify && (prevStatus !== null))
            if (prevStatus !== status)
                interaction.channel.send(`${capitalize(defServer)}: ${icons[prevStatus]} ${capitalize(prevStatus)} ➜ ${icons[status]} ${capitalize(status)}`) // TODO capitalize
        
        const serverName = defServer.slice(0, 4) + (defServer.length > 4 ? '.' : '');

        interaction.guild.me.setNickname(`${icons[status]} ${capitalize(serverName)} - ${capitalize(status)}`);

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

            for (const zoneId in statuses)
                if (statuses[zoneId].hasOwnProperty(serverName))
                    statuses[zoneId][serverName] = status;
        });

    } catch (error) {
        console.error(`[fetchStatuses] Failed to fetch from ${url}`);
        throw error;
    }

}

function isValidServer(serverName) {

    for (const zoneId in statuses)
        if (statuses[zoneId].hasOwnProperty(serverName))
            return true;

    return false;
}

function capitalize(str) {
    return str[0].toUpperCase() + str.slice(1);
}

client.login(token);
