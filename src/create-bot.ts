import { Bot } from '../deps.ts';
import { type Config } from './types.ts';
import { User } from './user.ts';
import { type Api } from './api.ts';

export const createBot = (config: Config, api: Api): Bot => {
    // Create an instance of the `Bot` class and pass your bot token to it.
    const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

    // You can now register listeners on your bot object `bot`.
    // grammY will call the listeners when users send messages to your bot.

    // Handle the /start command.
    bot.command(
        'start',
        async (ctx) => {
            const senderUser = User.from(ctx);
            if (!senderUser) {
                return;
            }
            const existingUser = await api.resolve(
                'GET /api/users/:key/:id',
                `/api/users/telegramId/${senderUser.telegramId}`,
            );
            if (existingUser) {
                ctx.reply(`Hola de nou ${existingUser.firstName} :)`);
                return;
            }

            const createdUser = await api.resolve(
                'PUT /api/users',
                '/api/users',
                {
                    method: 'PUT',
                    body: JSON.stringify(senderUser),
                },
            );
            if (createdUser) {
                ctx.reply(
                    "Hola, sóc la llibretera i estic ací per ajudar-te a gestionar l'intercanvi de llibres amb les teues amigues.",
                );
            }
        },
    );
    /*
    bot.command('newbook', async (ctx) => {
        console.log(ctx);
        const isbn = ctx.message?.text;
        const book = await fetch(`https://openlibrary.org/isbn/${isbn}.json`).then(res => res.ok && res.json<any>());
        ctx.reply(`
\`\`\`
${JSON.stringify(book, null, 2)}
\`\`\`
        `,  { parse_mode: "MarkdownV2" },
        );
    });
    */
    // Handle other messages.
    bot.on('message', (ctx) => {
        ctx.reply('Disculpa, però ara per ara no sé fer res més :D');
    });

    // Now that you specified how to handle messages, you can start your bot.
    // This will connect to the Telegram servers and wait for messages.

    // Start the bot.
    bot.start();

    return bot;
};
