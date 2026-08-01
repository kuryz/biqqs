import { RowDataPacket } from 'mysql2/promise';

import { BaseRepository } from './BaseRepository';
import { CacheService } from '../services/CacheService';
import {
    Summary,
    SummaryBucket,
    TransactionType
} from '../types';

export class TransactionRepository extends BaseRepository {

    constructor(
        private readonly cache: CacheService
    ) {
        super();
    }

    private static readonly SINCE_SQL: Record<
    "today" | "week" | "month",
    string
    > = {
        today: `(CURDATE())`,
        week: `(NOW() - INTERVAL 7 DAY)`,
        month: `(DATE_FORMAT(NOW(), '%Y-%m-01'))`
    };

    private reportCacheKey(
        businessId: number,
        bucket: string
    ) {
        return `report:${businessId}:${bucket}`;
    }

    private debtsCacheKey(
        businessId: number
    ) {
        return `debts:${businessId}`;
    }

    private usageCacheKey(
        businessId: number
    ) {
        return `usage:${businessId}`;
    }

    private async invalidate(
        businessId: number
    ) {

        await Promise.all([
            this.cache.delPrefix(`report:${businessId}:`),
            this.cache.del(this.debtsCacheKey(businessId)),
            this.cache.del(this.usageCacheKey(businessId))
        ]);

    }

    public async addTransaction(
        businessId: number,
        type: TransactionType,
        item: string | null,
        amount: number,
        rawMessage: string
    ): Promise<void> {

        await this.execute(
            `INSERT INTO transactions
            (business_id,type,item,amount,raw_message)
            VALUES (?,?,?,?,?)`,
            [
                businessId,
                type,
                item,
                amount,
                rawMessage
            ]
        );

        await this.invalidate(businessId);

    }

    /**
     * Number of sale/expense transactions logged this calendar month.
     * (Billable "records" also include new debts - see
     * DebtRepository.countThisMonth, summed together in UsageService.)
     */
    public async countRecordsThisMonth(
        businessId: number
    ): Promise<number> {

        const row = await this.first<
            RowDataPacket & { count: number }
        >(
            `SELECT COUNT(*) AS count
             FROM transactions
             WHERE business_id = ?
               AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')`,
            [businessId]
        );

        return Number(row?.count ?? 0);

    }

    public async getSummary(businessId: number, bucket: "today" | "week" | "month"): Promise<Summary>
    {
        const cacheKey = this.reportCacheKey(
            businessId,
            bucket
        );
        const cached = await this.cache.get<Summary>(
            cacheKey
        );
        if (cached) {
            return cached;
        }
        const summary = await this.fetchSummary(
            businessId,
            TransactionRepository.SINCE_SQL[bucket]
        );
        // Cache for 30 seconds.
        await this.cache.set(
            cacheKey,
            summary,
            30
        );
        return summary;    
    }

    private async fetchSummary(businessId: number, sinceSql: string): Promise<Summary> {
        const sales = await this.first<SummaryBucket & RowDataPacket>(
            `
            SELECT
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE business_id = ?
              AND type = 'sale'
              AND created_at >= ${sinceSql}
            `,
            [businessId]
        );
    
        const expenses = await this.first<SummaryBucket & RowDataPacket>(
            `
            SELECT
                COALESCE(SUM(amount), 0) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE business_id = ?
              AND type = 'expense'
              AND created_at >= ${sinceSql}
            `,
            [businessId]
        );
    
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