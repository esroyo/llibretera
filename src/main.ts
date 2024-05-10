import { Bot, dotenvLoad, serve, webhookCallback } from '../deps.ts';
import { Config } from './types.ts';

// Step: resolve config
dotenvLoad({ export: true });

const config: Config = {
    BOT_TOKEN: Deno.env.get('BOT_TOKEN') ?? '',
};
console.log('Config:', config);

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(config.BOT_TOKEN);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command('start', (ctx) => ctx.reply('Hola, sóc la llibretera i estic ací per ajudar-te a gestionar l\'intercanvi de llibres amb les teues amigues.'));
// Handle other messages.
bot.on('message', (ctx) => ctx.reply('Disculpa, per ara no se fer res més :D'));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
serve(webhookCallback(bot, 'std/http'), { port: 8000 });
