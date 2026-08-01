import { RowDataPacket } from "mysql2/promise";

import { BaseRepository } from "./BaseRepository";
import { CacheService } from "../services/CacheService";

import { Debt } from "../types";

export class DebtRepository extends BaseRepository {

    constructor(
        private readonly cache: CacheService
    ) {
        super();
    }

    private cacheKey(
        businessId: number
    ): string {

        return `debts:${businessId}`;

    }

    private async invalidate(
        businessId: number
    ): Promise<void> {

        await Promise.all([

            this.cache.del(
                this.cacheKey(businessId)
            ),

            this.cache.delPrefix(
                `report:${businessId}:`
            ),

            this.cache.del(
                `usage:${businessId}`
            )

        ]);

    }

    /**
     * Create a new credit sale.
     */
    public async create(
        businessId: number,
        debtorName: string,
        amount: number,
        rawMessage: string
    ): Promise<void> {

        await this.execute(

            `INSERT INTO debts
            (
                business_id,
                debtor_name,
                amount,
                raw_message
            )
            VALUES
            (
                ?,?,?,?
            )`,

            [
                businessId,
                debtorName,
                amount,
                rawMessage
            ]

        );

        await this.invalidate(
            businessId
        );

    }

    /**
     * Mark every open debt for a debtor as paid.
     */
    public async markPaid(
        businessId: number,
        debtorName: string
    ): Promise<number> {

        const result = await this.execute(

            `UPDATE debts
             SET
                status='paid',
                settled_at=NOW()
             WHERE
                business_id=?
             AND
                debtor_name=?
             AND
                status='open'`,

            [
                businessId,
                debtorName
            ]

        );

        await this.invalidate(
            businessId
        );

        return result.affectedRows;

    }

    /**
     * Retrieve open debts.
     */
    public async getOpenDebts(
        businessId: number
    ): Promise<Debt[]> {

        const key = this.cacheKey(
            businessId
        );

        const cached =
            await this.cache.get<Debt[]>(key);

        if (cached) {
            return cached;
        }

        const rows = await this.query<
            Debt[] & RowDataPacket[]
        >(

            `SELECT *
             FROM debts
             WHERE business_id=?
             AND status='open'
             ORDER BY created_at DESC`,

            [
                businessId
            ]

        );

        await this.cache.set(
            key,
            rows,
            30
        );

        return rows;

    }

    /**
     * Outstanding balance.
     */
    public async getOutstandingAmount(
        businessId: number
    ): Promise<number> {

        const row = await this.first<
            RowDataPacket & {
                total: number;
            }
        >(

            `SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total

             FROM debts

             WHERE
                business_id=?

             AND
                status='open'`,

            [
                businessId
            ]

        );

        return Number(
            row?.total ?? 0
        );

    }

    /**
     * Number of new debts this month.
     */
    public async countThisMonth(
        businessId: number
    ): Promise<number> {

        const row = await this.first<
            RowDataPacket & {
                count: number;
            }
        >(

            `SELECT
                COUNT(*) AS count

             FROM debts

             WHERE
                business_id=?

             AND
                created_at >= DATE_FORMAT(
                    NOW(),
                    '%Y-%m-01'
                )`,

            [
                businessId
            ]

        );

        return Number(
            row?.count ?? 0
        );

    }

}