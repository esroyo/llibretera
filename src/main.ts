import {
    Bot,
    dotenvLoad,
    Hono,
    serve,
    serveStatic,
    webhookCallback,
} from '../deps.ts';
import { DenoKvStorage } from './deno-kv-storage.ts';
import { Config, UserLike } from './types.ts';
import { User } from './user.ts';
import { UserRepository } from './user-repository.ts';

// Step: resolve config
dotenvLoad({ export: true });

const config: Config = {
    BOT_TOKEN: Deno.env.get('BOT_TOKEN') ?? '',
};
console.log('Config:', config);

const storage = new DenoKvStorage();
const userRepository = new UserRepository(storage);

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot(config.BOT_TOKEN);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command(
    'start',
    async (ctx) => {
        console.log(ctx);
        const sender = User.from(ctx);
        if (!sender) return;
        const user = await userRepository.getByTelegramId(sender.telegramId);
        if (!user) {
            await userRepository.store(sender);
            ctx.reply(
                "Hola, sóc la llibretera i estic ací per ajudar-te a gestionar l'intercanvi de llibres amb les teues amigues.",
            );
        } else {
            ctx.reply(`Hola de nou ${user.firstName} :)`);
        }
    },
);
// Handle other messages.
bot.on('message', (ctx) => {
    console.log(ctx);
    ctx.reply('Disculpa, però ara per ara no sé fer res més :D');
});

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
//bot.start();

const app = new Hono();

app.post('/bot', webhookCallback(bot, 'hono'));
app.get('/', (_ctx) => {
    return new Response(
        `
<!doctype HTML>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>la Llibretera</title>
</head>
<body>
  <h1>la Llibretera, pròximament ...</h1>
  <img src="/public/llibretera_bot.jpg" alt="la Llibretera" />
</body>
</html>`,
        { headers: { 'content-type': 'text/html' } },
    );
});
app.get('/public/*', serveStatic({ root: './' }));

serve(app.fetch, { port: 8000 });
