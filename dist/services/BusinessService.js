"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessService = void 0;
class BusinessService {
    repository;
    cache;
    CACHE_PREFIX = 'business';
    constructor(repository, cache) {
        this.repository = repository;
        this.cache = cache;
    }
    /**
     * Returns the business associated with a chat on a given channel
     * (Telegram chat id or WhatsApp phone number). Creates one
     * automatically if it doesn't exist.
     */
    async getOrCreateBusiness(chatId, channel) {
        const cacheKey = this.cacheKey(chatId, channel);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const business = await this.repository.findOrCreate(chatId, channel);
        await this.cache.set(cacheKey, business);
        return business;
    }
    /**
     * Returns a business without creating one.
     */
    async findByChatId(chatId, channel) {
        const cacheKey = this.cacheKey(chatId, channel);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const business = await this.repository.findByChatId(chatId, channel);
        if (business) {
            await this.cache.set(cacheKey, business);
        }
        return business;
    }
    /**
     * Upgrade a business plan.
     * Admin token validation can later move into an AuthService.
     *
     * Defaults to the Telegram channel to preserve the existing
     * `/admin_upgrade <chat_id> <token>` command's behavior; pass an
     * explicit channel if you need to upgrade a WhatsApp business.
     */
    async adminUpgrade(chatId, token, channel = 'telegram') {
        const expected = process.env.ADMIN_TOKEN;
        if (!expected || token !== expected) {
            return 'Invalid admin token.';
        }
        const business = await this.repository.findOrCreate(chatId, channel);
        await this.repository.updatePlan(business.id, 'pro');
        business.plan = 'pro';
        await this.cache.set(this.cacheKey(chatId, channel), business);
        return `✅ ${channel}:${chatId} upgraded to PRO.`;
    }
    /**
     * Removes a business from cache.
     */
    async clearCache(chatId, channel) {
        await this.cache.del(this.cacheKey(chatId, channel));
    }
    /**
     * Refresh cache after updates.
     */
    async refreshCache(business) {
        await this.cache.set(this.cacheKey(business.chatId, business.channel), business);
    }
    /**
     * Generates cache key.
     */
    cacheKey(chatId, channel) {
        return `${this.CACHE_PREFIX}:${channel}:${chatId}`;
    }
}
exports.BusinessService = BusinessService;
//# sourceMappingURL=BusinessService.js.map