export type Config = {
    CLIENT_SECRET_TOKEN: string;
    SELF_ORIGIN: string;
    TELEGRAM_BOT_TOKEN: string;
};

export type HttpVerb =
    | 'HEAD'
    | 'GET'
    | 'OPTIONS'
    | 'PATCH'
    | 'PUT'
    | 'POST'
    | 'DELETE';

export type TelegramId = string;

export type UserLike = {
    userId: string;
    userName?: string;
    firstName: string;
    lastName?: string;
    telegramId: TelegramId;
    languageCode?: string;
};

export type UserRepositoryLike = {
    get(user: Partial<UserLike>): Promise<UserLike | null>;
    put(user: UserLike): Promise<UserLike | null>;
};

export type StorageSetOptions = {
    expireIn?: number;
};

export interface StorageLike {
    get<T>(key: Deno.KvKey): Promise<T | null>;
    set<T>(
        key: Deno.KvKey,
        value: T,
        options?: StorageSetOptions,
    ): Promise<void>;
    close(): Promise<void>;
}

declare global {
    interface Body<T = any> {
        json<U = T>(): Promise<U>;
    }
    interface Response<T = any> extends Body<T> {}
}

export type ResponseContent<T> = T extends null | undefined ? T
    : T extends Response<infer F> ? F
    : T;

export type RequestWithUrlPattern = Request & { urlPattern?: URLPattern };

export type PartialHonoContext = {
    req: {
        raw: RequestWithUrlPattern;
    };
};
