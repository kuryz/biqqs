import { Business, Channel } from '../types';

import { BusinessRepository } from '../repositories/BusinessRepository';
import { CacheService } from './CacheService';

export class BusinessService {
  private readonly CACHE_PREFIX = 'business';

  constructor(
    private readonly repository: BusinessRepository,
    private readonly cache: CacheService
  ) {}

  /**
   * Returns the business associated with a chat on a given channel
   * (Telegram chat id or WhatsApp phone number). Creates one
   * automatically if it doesn't exist.
   */
  public async getOrCreateBusiness(
    chatId: string,
    channel: Channel
  ): Promise<Business> {

    const cacheKey = this.cacheKey(chatId, channel);

    const cached =
      await this.cache.get<Business>(cacheKey);

    if (cached) {
      return cached;
    }

    const business =
      await this.repository.findOrCreate(chatId, channel);

    await this.cache.set(
      cacheKey,
      business
    );

    return business;
  }

  /**
   * Returns a business without creating one.
   */
  public async findByChatId(
    chatId: string,
    channel: Channel
  ): Promise<Business | null> {

    const cacheKey = this.cacheKey(chatId, channel);

    const cached =
      await this.cache.get<Business>(cacheKey);

    if (cached) {
      return cached;
    }

    const business =
      await this.repository.findByChatId(chatId, channel);

    if (business) {
      await this.cache.set(
        cacheKey,
        business
      );
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
  public async adminUpgrade(
    chatId: string,
    token: string,
    channel: Channel = 'telegram'
  ): Promise<string> {

    const expected =
      process.env.ADMIN_TOKEN;

    if (!expected || token !== expected) {
      return 'Invalid admin token.';
    }

    const business =
      await this.repository.findOrCreate(chatId, channel);

    await this.repository.updatePlan(
      business.id,
      'pro'
    );

    business.plan = 'pro';

    await this.cache.set(
      this.cacheKey(chatId, channel),
      business
    );

    return `✅ ${channel}:${chatId} upgraded to PRO.`;
  }

  /**
   * Removes a business from cache.
   */
  public async clearCache(
    chatId: string,
    channel: Channel
  ): Promise<void> {

    await this.cache.del(
      this.cacheKey(chatId, channel)
    );

  }

  /**
   * Refresh cache after updates.
   */
  public async refreshCache(
    business: Business
  ): Promise<void> {

    await this.cache.set(
      this.cacheKey(business.chatId, business.channel),
      business
    );

  }

  /**
   * Generates cache key.
   */
  private cacheKey(
    chatId: string,
    channel: Channel
  ): string {

    return `${this.CACHE_PREFIX}:${channel}:${chatId}`;

  }
}
