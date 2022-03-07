const { Client, Intents, Permissions, MessageEmbed } = require('discord.js');
const { token } = require('./config.json');
const axios = require('axios');
const cheerio = require('cheerio');



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
const updateInterval = 30 * 1000; // 30 sec
let myServer, statusChannelId, onlineChannelId, onlineUpdater;
let displayOnline = false;
let notify = true;



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

client.on('interactionCreate', async interaction => {

    const { commandName } = interaction; // TODO extract options
    
    if (commandName === 'setserver') {

        try {
            const serverName = interaction.options.getString('servername').toLowerCase();

            if (isValidServer(serverName)) { 

                if (statusChannelId === undefined) { // create // TODO check statusChannel still exists
                
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
    // TODO update online as well
    else if (commandName === 'update') {
        try {
            if (statusChannelId === undefined)
                await interaction.reply(`❌ Error: Server is not set. Set server first using \`/setserver\`.`);
            else {
                updateChannel(interaction);
                await interaction.reply(`Updated status of **${capitalize(myServer)}**.`);
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
            const zoneId = interaction.options.getString('zonename');
            await interaction.reply({ embeds: [ generateZoneEmbed(zoneId) ] });

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
    else if (commandName === 'online') {

        try {
            const activate = interaction.options.getString('switch');
    
            if (activate === null) // no option
                displayOnline = !displayOnline;
            else
                displayOnline = (activate === 'on');

            if (displayOnline) {

                // setTimeout(() => {
                //     onlineUpdater = setInterval(() => {
                //         updateOnline(interaction);
                //     }, updateInterval);
                // }, updateInterval);

                await createOnlineChannel(interaction);
            }
            else {
                onlineUpdater = undefined;
                onlineChannelId = undefined;
            }

            await interaction.reply(`**${displayOnline ? 'Start' : 'Stop'}** displaying number of people playing Lost Ark.`);

        } catch (error) {
            console.error(error.message);
            await interaction.reply(`❌ Error: ` + error.message);
        }
        
    }
    else if (commandName === 'help') {
        await interaction.reply(''  +'\`/online\ (ON/OFF)` Display number of people playing Lost Ark. \n'
                                    +'\`/setserver <servername>\` Set default server to display. \n'
                                    +'\`/update\` Update status of default server. \n'
                                    +'\`/server <servername>\` Display status of a specified server. \n'
                                    +'\`/zone <zonename>\` Display status of servers in a specified zone. \n'
                                    +'\`/all\` Display status of all servers. \n'
                                    +'\n'
                                    +'*\`<>\`: Required \`()\`: Optional*'); // TODO add update interval
    }

});

// TODO rename
async function createChannel(interaction) {

    await fetchStatuses();
    let statusString = getStatusString(myServer);

    const channel = await interaction.guild.channels.create(statusString, {
        type: 'GUILD_VOICE',
        permissionOverwrites: [
            { // private channel
                id: interaction.guild.roles.everyone,
                deny: [Permissions.FLAGS.CONNECT],
            },
            { // except myself
                id: interaction.guild.me,
                allow: [Permissions.FLAGS.CONNECT],
            }
        ]
    });
    statusChannelId = channel.id;

    await interaction.channel.send(`Created status display.`);
}

async function createOnlineChannel(interaction) {

    const maxMemberCount = interaction.guild.memberCount;
    let onlineMemberCount = 0;
    // TODO count
    // console.debug(interaction.guild.members.list())
    // interaction.guild.members.resolve().forEach(member => {
    //     console.debug(member.presence.activities)
    // });
    const icon = onlineMemberCount ? '🟢' : '⚫';
    const onlineString = `${icon} Lost Ark ${onlineMemberCount} / ${maxMemberCount}`;

    const channel = await interaction.guild.channels.create(onlineString, {
        type: 'GUILD_VOICE',
        permissionOverwrites: [
            { // private channel
                id: interaction.guild.roles.everyone,
                deny: [Permissions.FLAGS.CONNECT],
            },
            { // except myself
                id: interaction.guild.me,
                allow: [Permissions.FLAGS.CONNECT],
            }
        ]
    });
    onlineChannelId = channel.id;

    await interaction.channel.send(`Created online display.`);
}

async function updateChannel(interaction, isDiffChannel) {

    if (statusChannelId === undefined) // TODO destroy timer
        return;
    else {

        let prevStatusString = getStatusString(myServer);
        await fetchStatuses();
        let statusString = getStatusString(myServer);
    
        if (isDiffChannel || (prevStatusString !== statusString)) { // different channel or update status
    
            try {
                let channel = await interaction.guild.channels.fetch(statusChannelId);
                await channel.setName(statusString);
            } catch (error) {
                console.debug(error)
                if (error.code === 10003) // unknown channel
                    statusChannelId = undefined;
                else
                    throw error;
            }
    
            if (notify && (prevStatusString !== statusString)) // notify status update
                interaction.channel.send(`${capitalize(myServer)}: ${prevStatusString.slice(0,1)} ➜ ${statusString.slice(0,1)}`);
        }
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

function generateZoneEmbed(zoneId) {
    return new MessageEmbed().addFields(generateZoneField(zoneId));
}

function generateAllEmbed() {

    let allStatuses = [];

    for (const zoneId in statuses)
        allStatuses.push(generateZoneField(zoneId));

    return new MessageEmbed().addFields(...allStatuses);
}

function generateZoneField(zoneId) {
    
    let zoneStatuses = { name: `🌎 ${statuses[zoneId].name}`, value: '' }

    for (const serverName in statuses[zoneId])
        if (serverName !== 'name')
            zoneStatuses.value += `${icons[statuses[zoneId][serverName]]} ${capitalize(serverName)} \n`;

    return zoneStatuses;
}

client.login(token);
