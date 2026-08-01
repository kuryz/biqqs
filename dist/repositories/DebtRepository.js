"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebtRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
class DebtRepository extends BaseRepository_1.BaseRepository {
    cache;
    constructor(cache) {
        super();
        this.cache = cache;
    }
    cacheKey(businessId) {
        return `debts:${businessId}`;
    }
    async invalidate(businessId) {
        await Promise.all([
            this.cache.del(this.cacheKey(businessId)),
            this.cache.delPrefix(`report:${businessId}:`),
            this.cache.del(`usage:${businessId}`)
        ]);
    }
    /**
     * Create a new credit sale.
     */
    async create(businessId, debtorName, amount, rawMessage) {
        await this.execute(`INSERT INTO debts
            (
                business_id,
                debtor_name,
                amount,
                raw_message
            )
            VALUES
            (
                ?,?,?,?
            )`, [
            businessId,
            debtorName,
            amount,
            rawMessage
        ]);
        await this.invalidate(businessId);
    }
    /**
     * Mark every open debt for a debtor as paid.
     */
    async markPaid(businessId, debtorName) {
        const result = await this.execute(`UPDATE debts
             SET
                status='paid',
                settled_at=NOW()
             WHERE
                business_id=?
             AND
                debtor_name=?
             AND
                status='open'`, [
            businessId,
            debtorName
        ]);
        await this.invalidate(businessId);
        return result.affectedRows;
    }
    /**
     * Retrieve open debts.
     */
    async getOpenDebts(businessId) {
        const key = this.cacheKey(businessId);
        const cached = await this.cache.get(key);
        if (cached) {
            return cached;
        }
        const rows = await this.query(`SELECT *
             FROM debts
             WHERE business_id=?
             AND status='open'
             ORDER BY created_at DESC`, [
            businessId
        ]);
        await this.cache.set(key, rows, 30);
        return rows;
    }
    /**
     * Outstanding balance.
     */
    async getOutstandingAmount(businessId) {
        const row = await this.first(`SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total

             FROM debts

             WHERE
                business_id=?

             AND
                status='open'`, [
            businessId
        ]);
        return Number(row?.total ?? 0);
    }
    /**
     * Number of new debts this month.
     */
    async countThisMonth(businessId) {
        const row = await this.first(`SELECT
                COUNT(*) AS count

             FROM debts

             WHERE
                business_id=?

             AND
                created_at >= DATE_FORMAT(
                    NOW(),
                    '%Y-%m-01'
                )`, [
            businessId
        ]);
        return Number(row?.count ?? 0);
    }
}
exports.DebtRepository = DebtRepository;
//# sourceMappingURL=DebtRepository.js.map