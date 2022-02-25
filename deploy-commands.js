const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { token, clientId, guildId } = require('./config.json');



const serverList = [ 
    [ 'Azena',      'Azena' ],
    [ 'Una',        'Una' ],
    [ 'Regulus',    'Regulus' ],
    [ 'Avesta',     'Avesta' ],
    [ 'Galatur',    'Galatur' ],
    [ 'Karta',      'Karta' ],
    [ 'Ladon',      'Ladon' ],
    [ 'Kharmine',   'Kharmine' ],
    [ 'Elzowin',    'Elzowin' ], 
    [ 'Sasha',      'Sasha' ], 
    [ 'Adrinne ',   'Adrinne' ], 
    [ 'Aldebaran ', 'Aldebaran' ], 
    [ 'Zosma',      'Zosma' ], 
    [ 'Vykas',      'Vykas' ], 
    [ 'Danube',     'Danube' ], 
];

const commands = [
    new SlashCommandBuilder().setName('setserver').setDescription('Set default server to display.')
        .addStringOption(option => option.setName('servername').setDescription('Name of the server').setRequired(true).addChoices(serverList)),
    new SlashCommandBuilder().setName('server').setDescription('Display status of a server.'),
    new SlashCommandBuilder().setName('all').setDescription('Display status of all servers.'),
    new SlashCommandBuilder().setName('help').setDescription('Display commands.'),
]
.map(command => command.toJSON());

// console.log(commands[0])

const rest = new REST({ version: '9' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => {
        console.log('Successfully registered application commands.');
    })
	.catch(console.error);
