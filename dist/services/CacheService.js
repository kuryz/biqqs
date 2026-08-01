"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
class CacheService {
    redis;
    defaultTtl;
    cacheDir;
    constructor() {
        this.defaultTtl = Number(process.env.CACHE_TTL_SECONDS ?? 60);
        this.cacheDir = path_1.default.resolve(process.cwd(), "cache");
        // Ensure cache directory exists
        fs_1.promises.mkdir(this.cacheDir, { recursive: true }).catch(console.error);
        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            this.redis = new ioredis_1.default(redisUrl);
            this.redis.on("error", error => {
                console.error("Redis Error:", error.message);
            });
        }
    }
    getFilePath(key) {
        const hash = crypto_1.default
            .createHash("sha1")
            .update(key)
            .digest("hex");
        return path_1.default.join(this.cacheDir, `${hash}.json`);
    }
    /**
     * Read cache from file.
     */
    async getFromFile(key) {
        try {
            const file = this.getFilePath(key);
            const raw = await fs_1.promises.readFile(file, "utf8");
            const entry = JSON.parse(raw);
            if (Date.now() > entry.expiresAt) {
                await fs_1.promises.unlink(file).catch(() => { });
                return null;
            }
            return entry.value;
        }
        catch {
            return null;
        }
    }
    /**
     * Write cache to file.
     */
    async writeToFile(key, value, ttl) {
        const entry = {
            value,
            expiresAt: Date.now() + ttl * 1000
        };
        const file = this.getFilePath(key);
        await fs_1.promises.writeFile(file, JSON.stringify(entry), "utf8");
    }
    /**
     * Get cached value.
     */
    async get(key) {
        // Try Redis first
        if (this.redis) {
            try {
                const value = await this.redis.get(key);
                if (value) {
                    return JSON.parse(value);
                }
            }
            catch (err) {
                console.error("Redis GET failed:", err);
            }
        }
        // Fallback to file cache
        return this.getFromFile(key);
    }
    /**
     * Store value.
     */
    async set(key, value, ttlSeconds) {
        const ttl = ttlSeconds ?? this.defaultTtl;
        // Write Redis
        if (this.redis) {
            try {
                await this.redis.set(key, JSON.stringify(value), "EX", ttl);
            }
            catch (err) {
                console.error("Redis SET failed:", err);
            }
        }
        // Always write file cache
        await this.writeToFile(key, value, ttl);
    }
    /**
     * Delete one key.
     */
    async del(key) {
        if (this.redis) {
            try {
                await this.redis.del(key);
            }
            catch { }
        }
        await fs_1.promises.unlink(this.getFilePath(key)).catch(() => { });
    }
    /**
     * Delete keys by prefix.
     *
     * Redis supports SCAN.
     * File cache deletes every cached file because
     * filenames are hashed.
     */
    async delPrefix(prefix) {
        if (this.redis) {
            try {
                const stream = this.redis.scanStream({
                    match: `${prefix}*`
                });
                const keys = [];
                await new Promise((resolve, reject) => {
                    stream.on("data", (result) => {
                        keys.push(...result);
                    });
                    stream.on("end", resolve);
                    stream.on("error", reject);
                });
                if (keys.length) {
                    await this.redis.del(...keys);
                }
            }
            catch { }
        }
        // Hashed filenames prevent prefix lookup,
        // so clear the entire file cache.
        await this.flushFiles();
    }
    /**
     * Flush cache.
     */
    async flush() {
        if (this.redis) {
            try {
                await this.redis.flushdb();
            }
            catch { }
        }
        await this.flushFiles();
    }
    async flushFiles() {
        try {
            const files = await fs_1.promises.readdir(this.cacheDir);
            await Promise.all(files.map(file => fs_1.promises.unlink(path_1.default.join(this.cacheDir, file))));
        }
        catch { }
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=CacheService.js.map