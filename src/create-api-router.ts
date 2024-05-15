import { Hono } from '../deps.ts';
import { type Config } from './types.ts';
import { type Api } from './api.ts';

export const createApiRouter = (config: Config, api: Api): Hono => {
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

    const app = new Hono();

    app.put('/api/users', apiAuth, api['PUT /api/users']);
    app.get('/api/users/:key/:id', apiAuth, api['GET /api/users/:key/:id']);

    return app;
};
