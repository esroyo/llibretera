export type Config = {
    BOT_TOKEN: string;
};

export type TelegramId = number;

export type UserLike = {
    id: string;
    userName?: string;
    firstName: string;
    lastName?: string;
    telegramId: TelegramId;
};

export type UserRepositoryLike = {
    find(user: UserLike): Promise<UserLike | null>;
    store(user: UserLike): Promise<void>;
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
