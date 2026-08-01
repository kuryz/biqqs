"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class TransactionRepository extends BaseRepository_1.BaseRepository {
    cache;
    constructor(cache) {
        super();
        this.cache = cache;
    }
    static SINCE_SQL = {
        today: `(CURDATE())`,
        week: `(NOW() - INTERVAL 7 DAY)`,
        month: `(DATE_FORMAT(NOW(), '%Y-%m-01'))`
    };
    reportCacheKey(businessId, bucket) {
        return `report:${businessId}:${bucket}`;
    }
    debtsCacheKey(businessId) {
        return `debts:${businessId}`;
    }
    usageCacheKey(businessId) {
        return `usage:${businessId}`;
    }
    async invalidate(businessId) {
        await Promise.all([
            this.cache.delPrefix(`report:${businessId}:`),
            this.cache.del(this.debtsCacheKey(businessId)),
            this.cache.del(this.usageCacheKey(businessId))
        ]);
    }
    async addTransaction(businessId, type, item, amount, rawMessage) {
        await this.execute(`INSERT INTO transactions
            (business_id,type,item,amount,raw_message)
            VALUES (?,?,?,?,?)`, [
            businessId,
            type,
            item,
            amount,
            rawMessage
        ]);
        await this.invalidate(businessId);
    }
    /**
     * Number of sale/expense transactions logged this calendar month.
     * (Billable "records" also include new debts - see
     * DebtRepository.countThisMonth, summed together in UsageService.)
     */
    async countRecordsThisMonth(businessId) {
        const row = await this.first(`SELECT COUNT(*) AS count
             FROM transactions
             WHERE business_id = ?
               AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`, [businessId]);
        return Number(row?.count ?? 0);
    }
    async getSummary(businessId, bucket) {
        const cacheKey = this.reportCacheKey(businessId, bucket);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const summary = await this.fetchSummary(businessId, TransactionRepository.SINCE_SQL[bucket]);
        // Cache for 30 seconds.
        await this.cache.set(cacheKey, summary, 30);
        return summary;
    }
    async fetchSummary(businessId, sinceSql) {
        const sales = await this.first(`
            SELECT
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE business_id = ?
              AND type = 'sale'
              AND created_at >= ${sinceSql}
            `, [businessId]);
        const expenses = await this.first(`
            SELECT
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE business_id = ?
              AND type = 'expense'
              AND created_at >= ${sinceSql}
            `, [businessId]);
        return {
            sales: {
                total: Number(sales?.total ?? 0),
                count: Number(sales?.count ?? 0)
            },
            expenses: {
                total: Number(expenses?.total ?? 0),
                count: Number(expenses?.count ?? 0)
            }
        };
    }
}
exports.TransactionRepository = TransactionRepository;
//# sourceMappingURL=TransactionRepository.js.map