const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId, guildId } = require('./config.json');



const zoneList = [
    ['North America East (NAE)', 'nae'], 
    ['North America West (NAW)', 'naw'], 
    ['Europe Central (EUC)', 'euc'],
    ['Europe West (EUW)', 'euw'], 
    ['South America (SA)', 'sa'], 
];

const commands = [
    new SlashCommandBuilder().setName('setserver').setDescription('Set server to be displayed.')
        .addStringOption(option => option.setName('servername').setDescription('Name of a server').setRequired(true)),
    new SlashCommandBuilder().setName('update').setDescription('Update status of the server.'),
    new SlashCommandBuilder().setName('server').setDescription('Display status of a server.')
        .addStringOption(option => option.setName('servername').setDescription('Name of a server').setRequired(true)),
        new SlashCommandBuilder().setName('zone').setDescription('Display status of a server.')
            .addStringOption(option => option.setName('zonename').setDescription('Name of a zone').setRequired(true).addChoices(zoneList)),
    new SlashCommandBuilder().setName('all').setDescription('Display status of all servers.'),
    new SlashCommandBuilder().setName('help').setDescription('Display commands.'),
]
.map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => {
        console.log('Successfully registered application commands.');
    })
	.catch(console.error);
