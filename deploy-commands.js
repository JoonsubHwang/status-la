const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId, guildId } = require('./config.json');



const nae = [ 
    [ 'azena',      'azena' ],
    [ 'una',        'una' ],
    [ 'regulus',    'regulus' ],
    [ 'avesta',     'avesta' ],
    [ 'galatur',    'galatur' ],
    [ 'karta',      'karta' ],
    [ 'ladon',      'ladon' ],
    [ 'kharmine',   'kharmine' ],
    [ 'elzowin',    'elzowin' ], 
    [ 'sasha',      'sasha' ], 
    [ 'adrinne',   'adrinne' ], 
    [ 'aldebaran', 'aldebaran' ], 
    [ 'zosma',      'zosma' ], 
    [ 'vykas',      'vykas' ], 
    [ 'danube',     'danube' ], 
];

const commands = [
    new SlashCommandBuilder().setName('setserver').setDescription('Set default server to display.')
        .addStringOption(option => option.setName('servername').setDescription('Name of the server').setRequired(true)),
    new SlashCommandBuilder().setName('server').setDescription('Display status of a server.')
        .addStringOption(option => option.setName('servername').setDescription('Name of the server').setRequired(true)),
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
