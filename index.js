import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';



dotenv.config();

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
    ]
});

client.on('ready', () => {
    console.log('reacy');
});

// client.on('messageCreate', msg => {

// });

client.login(process.env.BOT_TOKEN);
