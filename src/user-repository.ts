import { StorageLike, UserLike, UserRepositoryLike } from './types.ts';

export class UserRepository implements UserRepositoryLike {
    protected _key = ['users', 'telegramId'];

    constructor(private storage: StorageLike) {}

    async get(user: Partial<UserLike>): Promise<UserLike | null> {
        if (!user.telegramId) {
            return null;
        }
        return this.storage.get<UserLike>(this._buildKey(user.telegramId));
    }

    async put(user: UserLike): Promise<UserLike | null> {
        const existingUser = await this.get(user);
        if (existingUser) {
            // Should use PATCH
            return null;
        }
        await this.storage.set(this._buildKey(user.telegramId), user);
        return user;
    }

    protected _buildKey(...kvKeyParts: Deno.KvKey): Deno.KvKey {
        return [...this._key, ...kvKeyParts];
    }
}
