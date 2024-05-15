import { Hono, serveStatic } from '../deps.ts';

export const createWebRouter = (): Hono => {
    const app = new Hono();

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
    return app;
};
