import { type HonoContext } from '../deps.ts';
import type {
    Config,
    HttpVerb,
    PartialHonoContext,
    ResponseContent,
    UserLike,
    UserRepositoryLike,
} from './types.ts';

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
        ctx.req.raw.urlPattern = this._buildUrlPattern(pathname);
        return originalMethod.call(this, ctx);
    }
    return replacementMethod;
}

export class Api {
    protected _urlPatterns: Map<string, URLPattern> = new Map();

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

    protected _buildUrlPattern(pathname: string): URLPattern {
        if (this._urlPatterns.has(pathname)) {
            return this._urlPatterns.get(pathname) as URLPattern;
        }
        const urlPattern = new URLPattern({ pathname });
        this._urlPatterns.set(pathname, urlPattern);
        return urlPattern;
    }
}
