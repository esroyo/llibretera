import { kvGet, kvSet } from '../deps.ts';
import { StorageLike, StorageSetOptions } from './types.ts';

export class DenoKvStorage implements StorageLike {
    constructor(private kv: Promise<Deno.Kv> = Deno.openKv()) {}

    public async get<T>(key: Deno.KvKey): Promise<T | null> {
        const settledKv = await this.kv;
        const blob = await kvGet(settledKv, key);
        const value = blob && JSON.parse(new TextDecoder().decode(blob));
        return value || null;
    }

    public async set<T>(
        key: Deno.KvKey,
        value: T,
        options?: StorageSetOptions,
    ): Promise<void> {
        const settledKv = await this.kv;
        const blob = new TextEncoder().encode(JSON.stringify(value));
        await kvSet(settledKv, key, blob, options);
    }

    public async close(): Promise<void> {
        const settledKv = await this.kv;
        return settledKv.close();
    }
}
