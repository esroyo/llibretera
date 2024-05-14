import {
    Bot,
    dotenvLoad,
    Hono,
    serve,
    serveStatic,
    webhookCallback,
} from '../deps.ts';
import { DenoKvStorage } from './deno-kv-storage.ts';
import { Config } from './types.ts';
import { User } from './user.ts';
import { UserRepository } from './user-repository.ts';
import { Api } from './api.ts';

// Step: resolve config
dotenvLoad({ export: true });

const config: Config = {
    CLIENT_SECRET_TOKEN: Deno.env.get('CLIENT_SECRET_TOKEN') ?? '',
    SELF_ORIGIN: Deno.env.get('SELF_ORIGIN') ?? 'http://localhost/',
    TELEGRAM_BOT_TOKEN: Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '',
};
console.log('Config:', config);

const storage = new DenoKvStorage();
const userRepository = new UserRepository(storage);
const api = new Api(config, userRepository);

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

        const createdUser = await api.resolve('PUT /api/users', '/api/users', {
            method: 'PUT',
            body: JSON.stringify(senderUser),
        });
        if (createdUser) {
            ctx.reply(
                "Hola, sóc la llibretera i estic ací per ajudar-te a gestionar l'intercanvi de llibres amb les teues amigues.",
            );
        }
    },
);
// Handle other messages.
bot.on('message', (ctx) => {
    ctx.reply('Disculpa, però ara per ara no sé fer res més :D');
});

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
// bot.start();

const app = new Hono();

const apiAuth = async ({ req: { raw: request } }, next) => {
    const secretToken = request.headers.get('x-authorization');
    const isAuthorized = secretToken && (
        secretToken === config.CLIENT_SECRET_TOKEN ||
        secretToken.slice(7) === config.CLIENT_SECRET_TOKEN
    );
    if (!isAuthorized) {
        return new Response('Unauthorized', { status: 401 });
    }
    return next();
};

app.post(
    '/bot',
    webhookCallback(bot, 'hono', { secretToken: config.CLIENT_SECRET_TOKEN }),
);

app.put('/api/users', apiAuth, api['PUT /api/users']);
app.get('/api/users/:key/:id', apiAuth, api['GET /api/users/:key/:id']);

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
  <img src="/public/llibretera_bot.jpg" alt="la Llibretera" style="width: 100%; object-fit: scale-down; object-position: left top;" />
</body>
</html>`,
        { headers: { 'content-type': 'text/html' } },
    );
});

app.get('/public/*', serveStatic({ root: './' }));

serve(app.fetch, { port: 8000 });
