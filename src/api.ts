import type {
    Config,
    HttpVerb,
    PartialHonoContext,
    ResponseContent,
    UserLike,
    UserRepositoryLike,
} from './types.ts';

let urlPatterns: Map<string, URLPattern>;

function createUrlPattern(pathname: string): URLPattern {
    if (!urlPatterns) {
        urlPatterns = new Map<string, URLPattern>();
    }
    if (urlPatterns.has(pathname)) {
        return urlPatterns.get(pathname) as URLPattern;
    }
    const urlPattern = new URLPattern({ pathname });
    urlPatterns.set(pathname, urlPattern);
    return urlPattern;
}

function withUrlPattern(
    originalMethod: Api[Extract<keyof Api, `${HttpVerb} ${string}`>],
    context: ClassMethodDecoratorContext<Api>,
) {
    const methodName = String(context.name);
    const [_verb, pathname] = methodName.split(' ');
    function replacementMethod(
        this: Api,
        ctx: PartialHonoContext,
    ): Promise<Response> {
        ctx.req.raw.urlPattern = createUrlPattern(pathname);
        return originalMethod.call(this, ctx);
    }
    return replacementMethod;
}

export class Api {
    constructor(
        protected _config: Config,
        protected _userRepository: UserRepositoryLike,
    ) {}

    @withUrlPattern
    async ['PUT /api/users'](
        { req: { raw: request } }: PartialHonoContext,
    ): Promise<Response<boolean>> {
        const userCandidate = await request.json<UserLike>();
        const createdUser = await this._userRepository.put(userCandidate);
        return createdUser
            ? new Response('Created', { status: 201 })
            : new Response('Conflict', { status: 409 });
    }

    @withUrlPattern
    async ['GET /api/users/:key/:id'](
        { req: { raw: request } }: PartialHonoContext,
    ): Promise<Response<UserLike>> {
        const params = request.urlPattern?.exec(request.url)?.pathname.groups;
        let existingUser: UserLike | null = null;
        if (params?.key && params?.id) {
            existingUser = await this._userRepository.get({
                [params.key]: params.id,
            });
        }
        return existingUser
            ? Response.json(existingUser)
            : new Response('Not Found', { status: 404 });
    }

    async resolve<T extends Extract<keyof Api, `${HttpVerb} ${string}`>>(
        resource: T,
        fetchInput: string | URL | Request,
        fetchInit?: RequestInit | undefined,
    ): Promise<null | ResponseContent<Awaited<ReturnType<Api[T]>>>> {
        const shouldMakeUrl = typeof fetchInput === 'string' &&
            !fetchInput.startsWith('http');
        const request = new Request(
            shouldMakeUrl
                ? new URL(fetchInput, this._config.SELF_ORIGIN)
                : fetchInput,
            fetchInit,
        );
        const synthHonoContext: PartialHonoContext = { req: { raw: request } };
        const response = await this[resource](synthHonoContext);
        if (!response.ok) {
            return null;
        }
        return (response.headers.get('content-type') === 'application/json'
            ? response.json()
            : {}) as ResponseContent<Awaited<ReturnType<Api[T]>>>;
    }
}
