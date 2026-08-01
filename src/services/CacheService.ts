import Redis from "ioredis";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class CacheService {
    private readonly redis?: Redis;
    private readonly defaultTtl: number;
    private readonly cacheDir: string;

    constructor() {
        this.defaultTtl = Number(process.env.CACHE_TTL_SECONDS ?? 60);
        this.cacheDir = path.resolve(process.cwd(), "cache");

        // Ensure cache directory exists
        fs.mkdir(this.cacheDir, { recursive: true }).catch(console.error);

        const redisUrl = process.env.REDIS_URL;

        if (redisUrl) {
            this.redis = new Redis(redisUrl);

            this.redis.on("error", error => {
                console.error("Redis Error:", error.message);
            });
        }
    }

    private getFilePath(key: string): string {
        const hash = crypto
            .createHash("sha1")
            .update(key)
            .digest("hex");

        return path.join(this.cacheDir, `${hash}.json`);
    }

    /**
     * Read cache from file.
     */
    private async getFromFile<T>(key: string): Promise<T | null> {
        try {
            const file = this.getFilePath(key);

            const raw = await fs.readFile(file, "utf8");
            const entry: CacheEntry<T> = JSON.parse(raw);

            if (Date.now() > entry.expiresAt) {
                await fs.unlink(file).catch(() => {});
                return null;
            }

            return entry.value;
        } catch {
            return null;
        }
    }

    /**
     * Write cache to file.
     */
    private async writeToFile<T>(
        key: string,
        value: T,
        ttl: number
    ): Promise<void> {
        const entry: CacheEntry<T> = {
            value,
            expiresAt: Date.now() + ttl * 1000
        };

        const file = this.getFilePath(key);

        await fs.writeFile(
            file,
            JSON.stringify(entry),
            "utf8"
        );
    }

    /**
     * Get cached value.
     */
    public async get<T>(key: string): Promise<T |null> {
        // Try Redis first
        if (this.redis) {
            try {
                const value = await this.redis.get(key);

                if (value) {
                    return JSON.parse(value);
                }
            } catch (err) {
                console.error("Redis GET failed:", err);
            }
        }

        // Fallback to file cache
        return this.getFromFile<T>(key);
    }

    /**
     * Store value.
     */
    public async set<T>(
        key: string,
        value: T,
        ttlSeconds?: number
    ): Promise<void> {
        const ttl = ttlSeconds ?? this.defaultTtl;

        // Write Redis
        if (this.redis) {
            try {
                await this.redis.set(
                    key,
                    JSON.stringify(value),
                    "EX",
                    ttl
                );
            } catch (err) {
                console.error("Redis SET failed:", err);
            }
        }

        // Always write file cache
        await this.writeToFile(key, value, ttl);
    }

    /**
     * Delete one key.
     */
    public async del(key: string): Promise<void> {
        if (this.redis) {
            try {
                await this.redis.del(key);
            } catch {}
        }

        await fs.unlink(this.getFilePath(key)).catch(() => {});
    }

    /**
     * Delete keys by prefix.
     *
     * Redis supports SCAN.
     * File cache deletes every cached file because
     * filenames are hashed.
     */
    public async delPrefix(prefix: string): Promise<void> {
        if (this.redis) {
            try {
                const stream = this.redis.scanStream({
                    match: `${prefix}*`
                });

                const keys: string[] = [];

                await new Promise<void>((resolve, reject) => {
                    stream.on("data", (result: string[]) => {
                        keys.push(...result);
                    });

                    stream.on("end", resolve);
                    stream.on("error", reject);
                });

                if (keys.length) {
                    await this.redis.del(...keys);
                }
            } catch {}
        }

        // Hashed filenames prevent prefix lookup,
        // so clear the entire file cache.
        await this.flushFiles();
    }

    /**
     * Flush cache.
     */
    public async flush(): Promise<void> {
        if (this.redis) {
            try {
                await this.redis.flushdb();
            } catch {}
        }

        await this.flushFiles();
    }

    private async flushFiles(): Promise<void> {
        try {
            const files = await fs.readdir(this.cacheDir);

            await Promise.all(
                files.map(file =>
                    fs.unlink(path.join(this.cacheDir, file))
                )
            );
        } catch {}
    }
}