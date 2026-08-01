import { Business } from "../types";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { DebtRepository } from "../repositories/DebtRepository";

export class UsageLimitReachedError extends Error {
    constructor() {
        super("Monthly free plan limit reached.");
        this.name = "UsageLimitReachedError";
    }
}

export interface UsageSummary {
    plan: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
}

export class UsageService {

    /**
     * Free-plan monthly cap on billable records (sale + expense +
     * new-credit entries). Configurable via FREE_TIER_MONTHLY_LIMIT;
     * defaults to 30 to match the README.
     */
    private static readonly FREE_LIMIT =
        Number(process.env.FREE_TIER_MONTHLY_LIMIT ?? 30);

    private static readonly PLAN_LIMITS: Record<string, number | null> = {
        free: UsageService.FREE_LIMIT,
        pro: null
    };

    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly debtRepository: DebtRepository
    ) {}

    /**
     * Returns usage information for the current month.
     */
    public async getUsageSummary(
        business: Business
    ): Promise<string> {

        const summary = await this.getUsage(business);

        if (summary.unlimited) {

            return `📦 Plan
            ${summary.plan.toUpperCase()}
            Usage ${summary.used} records
            Unlimited`.trim();

        }

        return `
📦 Plan

${summary.plan.toUpperCase()}

Used

${summary.used}/${summary.limit}

Remaining

${summary.remaining}
`.trim();

    }

    /**
     * Used before creating any billable record.
     */
    public async canCreateRecord(
        business: Business
    ): Promise<boolean> {

        const summary = await this.getUsage(business);

        if (summary.unlimited) {
            return true;
        }

        return summary.used < (summary.limit ?? 0);

    }

    /**
     * Throws if usage limit has been reached.
     */
    public async ensureCanCreateRecord(
        business: Business
    ): Promise<void> {

        const allowed = await this.canCreateRecord(
            business
        );

        if (allowed) {
            return;
        }

        throw new UsageLimitReachedError();

    }

    /**
     * Internal helper.
     */
    private async getUsage(
        business: Business
    ): Promise<UsageSummary> {

        const [transactionCount, debtCount] = await Promise.all([
            this.transactionRepository.countRecordsThisMonth(
                business.id
            ),
            this.debtRepository.countThisMonth(
                business.id
            )
        ]);

        const used = transactionCount + debtCount;

        const limit =
            UsageService.PLAN_LIMITS[business.plan] ?? null;

        return {

            plan: business.plan,

            used,

            limit,

            remaining:
                limit === null
                    ? null
                    : Math.max(0, limit - used),

            unlimited:
                limit === null

        };

    }

}