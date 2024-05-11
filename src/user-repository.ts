import { StorageLike, UserLike, UserRepositoryLike } from './types.ts';

export class UserRepository implements UserRepositoryLike {
    protected _key = 'user';

    constructor(private storage: StorageLike) {}

    find(user: UserLike): Promise<UserLike | null> {
        return this.storage.get<UserLike>([this._key, user.telegramId]);
    }

    async store(user: UserLike): Promise<void> {
        await Promise.all([
            this.storage.set(this._buildKey(user.id), user),
            this.storage.set(this._buildKey(user.telegramId), user),
        ]);
    }

    protected _buildKey(...kvKeyParts: Deno.KvKey): Deno.KvKey {
        return [this._key, ...kvKeyParts];
    }
}
