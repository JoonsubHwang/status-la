const { Client, Intents, Permissions, MessageEmbed } = require('discord.js');
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

let myServer, statusChannel;
let notify = true;

client.once('ready', () => {
    console.log('ready');
});

client.on('interactionCreate', async interaction => {

    const { commandName } = interaction;
    
    if (commandName === 'setserver') {

        try {
            const serverName = interaction.options.getString('servername').toLowerCase();

            if (isValidServer(serverName)) { 

                if (statusChannel === undefined) { // create // TODO check statusChannel still exists
                
                    myServer = serverName;
    
                    setTimeout(() => {
                        setInterval(() => {
                            updateChannel(interaction);
                        }, updateInterval);
                    }, updateInterval);
        
                    await createChannel(interaction);
                    await interaction.reply(`Server is set to **${capitalize(myServer)}**.`);
                }
                else if (serverName !== myServer) { // change server

                    myServer = serverName;
                    
                    updateChannel(interaction, true);
    
                    await interaction.reply(`Server is set to **${capitalize(myServer)}**.`);
                }
                else // same server
                    await interaction.reply(`Server has already been set to **${capitalize(myServer)}**.`);
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
            await interaction.reply({ embeds: [ generateAllEmbed() ] });

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

async function createChannel(interaction) {

    await fetchStatuses();
    let statusString = getStatusString(myServer);

    const channel = await interaction.guild.channels.create(statusString, {
        type: 'GUILD_VOICE',
        permissionOverwrites: [
            { // private channel
                id: interaction.guild.roles.everyone,
                deny: [Permissions.FLAGS.VIEW_CHANNEL],
            },
            { // except myself
                id: interaction.guild.me,
                allow: [Permissions.FLAGS.VIEW_CHANNEL],
            }
        ]
    });
    statusChannel = channel.id;

    await interaction.channel.send(`Created status display.`);
}

async function updateChannel(interaction, isDiffChannel) {

    let prevStatusString = getStatusString(myServer);
    await fetchStatuses();
    let statusString = getStatusString(myServer);

    if (isDiffChannel || (prevStatusString !== statusString)) { // different channel or update status

        let channel = await interaction.guild.channels.fetch(statusChannel);
        await channel.setName(statusString);

        if (notify && (prevStatusString !== statusString)) // notify status update
            interaction.channel.send(`${capitalize(myServer)}: ${prevStatusString.slice(0,1)} ➜ ${statusString.slice(0,1)}`);
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

function getStatusString(serverName) {

    const maxLength = 6;

    let status;
    for (const zone in statuses)
        if (statuses[zone].hasOwnProperty(serverName))
            status = statuses[zone][serverName];

    serverName = serverName.slice(0, maxLength) + (serverName.length > maxLength ? '.' : '');
    
    return `${icons[status]} ${capitalize(serverName)} - ${capitalize(status)}`;
}

function generateAllEmbed() {

    let allStatuses = [];

    for (const zoneId in statuses) {

        let zoneStatuses = { name: `🌎 ${statuses[zoneId].name}`, value: '', inline: true }

        for (const serverName in statuses[zoneId])
            if (serverName !== 'name')
                zoneStatuses.value += `${icons[statuses[zoneId][serverName]]} ${capitalize(serverName)} \n`;

        allStatuses.push(zoneStatuses);
    }

    return new MessageEmbed()
        .addFields(...allStatuses);
}

client.login(token);
