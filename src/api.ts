import { type HonoContext } from '../deps.ts';
import type {
    Config,
    HttpVerb,
    ResponseContent,
    UserLike,
    UserRepositoryLike,
} from './types.ts';

function withPattern(
    originalMethod: any,
    context: ClassMethodDecoratorContext<Api>,
) {
    const methodName = String(context.name);
    const [_verb, pathname] = methodName.split(' ');
    function replacementMethod(this: any, ...args: any[]) {
        this._currentUrlPattern = this._buildPattern(pathname);
        const result = originalMethod.apply(this, args);
        this._currentUrlPattern = null;
        return result;
    }
    return replacementMethod;
}

export class Api {
    protected _urlPatterns: Map<string, URLPattern> = new Map();
    protected _currentUrlPattern: URLPattern | null = null;

    constructor(
        protected _config: Config,
        protected _userRepository: UserRepositoryLike,
    ) {}

    @withPattern
    async ['PUT /api/users'](
        ctx: HonoContext | Request,
    ): Promise<Response<boolean>> {
        const request = this._takeRequest(ctx);
        const userCandidate = await request.json<UserLike>();
        const createdUser = await this._userRepository.put(userCandidate);
        return createdUser
            ? new Response('Created', { status: 201 })
            : new Response('Conflict', { status: 409 });
    }

    @withPattern
    async ['GET /api/users/:key/:id'](
        ctx: HonoContext | Request,
    ): Promise<Response<UserLike>> {
        const request = this._takeRequest(ctx);
        const params = this._currentUrlPattern?.exec(request.url)?.pathname
            .groups;
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

    async resolve<T extends Extract<keyof Api, `${HttpVerb}${string}`>>(
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
        const response = await this[resource](request);
        if (!response.ok) {
            return null;
        }
        return (response.headers.get('content-type') === 'application/json'
            ? response.json()
            : {}) as ResponseContent<Awaited<ReturnType<Api[T]>>>;
    }

    protected _takeRequest(ctx: HonoContext | Request): Request {
        return ctx instanceof Request ? ctx : ctx.req.raw;
    }

    protected _buildPattern(pathname: string): URLPattern {
        if (this._urlPatterns.has(pathname)) {
            return this._urlPatterns.get(pathname) as URLPattern;
        }
        const urlPattern = new URLPattern({ pathname });
        this._urlPatterns.set(pathname, urlPattern);
        return urlPattern;
    }
}