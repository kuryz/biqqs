"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const Business_1 = require("../models/Business");
class BusinessRepository extends BaseRepository_1.BaseRepository {
    async findByChatId(chatId, channel) {
        const row = await this.first(`
      SELECT *
      FROM businesses
      WHERE chat_id = ?
      AND channel = ?
      LIMIT 1
      `, [chatId, channel]);
        if (!row) {
            return null;
        }
        return this.map(row);
    }
    async create(chatId, channel) {
        const result = await this.execute(`
      INSERT INTO businesses
      (
          chat_id,
          channel,
          plan
      )
      VALUES
      (
          ?,
          ?,
          'free'
      )
      `, [chatId, channel]);
        return new Business_1.Business(result.insertId, chatId, channel, null, 'free', new Date());
    }
    async updatePlan(businessId, plan) {
        await this.execute(`
      UPDATE businesses
      SET plan = ?
      WHERE id = ?
      `, [
            plan,
            businessId
        ]);
    }
    async findOrCreate(chatId, channel) {
        let business = await this.findByChatId(chatId, channel);
        if (business) {
            return business;
        }
        return this.create(chatId, channel);
    }
    map(row) {
        return new Business_1.Business(row.id, row.chat_id, row.channel, row.business_name, row.plan, row.created_at);
    }
}
exports.BusinessRepository = BusinessRepository;
//# sourceMappingURL=BusinessRepository.js.map