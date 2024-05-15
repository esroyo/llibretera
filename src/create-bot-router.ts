import { Bot, Hono, webhookCallback } from '../deps.ts';
import { type Config } from './types.ts';

export const createBotRouter = (config: Config, bot: Bot): Hono => {
    const app = new Hono();
    app.post(
        '/bot',
        webhookCallback(bot, 'hono', {
            secretToken: config.CLIENT_SECRET_TOKEN,
        }),
    );

    return app;
};
