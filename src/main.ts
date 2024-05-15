import { dotenvLoad, Hono, serve } from '../deps.ts';
import { DenoKvStorage } from './deno-kv-storage.ts';
import { Config } from './types.ts';
import { UserRepository } from './user-repository.ts';
import { Api } from './api.ts';
import { createApiRouter } from './create-api-router.ts';
import { createBot } from './create-bot.ts';
import { createBotRouter } from './create-bot-router.ts';
import { createWebRouter } from './create-web-router.ts';

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
const bot = createBot(config, api);
const botRouter = createBotRouter(config, bot);
const apiRouter = createApiRouter(config, api);
const webRouter = createWebRouter();

const app = new Hono();
app.route('/', botRouter);
app.route('/', apiRouter);
app.route('/', webRouter);

serve(app.fetch, { port: 8000 });
