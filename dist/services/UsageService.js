"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageService = exports.UsageLimitReachedError = void 0;
class UsageLimitReachedError extends Error {
    constructor() {
        super("Monthly free plan limit reached.");
        this.name = "UsageLimitReachedError";
    }
}
exports.UsageLimitReachedError = UsageLimitReachedError;
class UsageService {
    transactionRepository;
    debtRepository;
    /**
     * Free-plan monthly cap on billable records (sale + expense +
     * new-credit entries). Configurable via FREE_TIER_MONTHLY_LIMIT;
     * defaults to 30 to match the README.
     */
    static FREE_LIMIT = Number(process.env.FREE_TIER_MONTHLY_LIMIT ?? 30);
    static PLAN_LIMITS = {
        free: UsageService.FREE_LIMIT,
        pro: null
    };
    constructor(transactionRepository, debtRepository) {
        this.transactionRepository = transactionRepository;
        this.debtRepository = debtRepository;
    }
    /**
     * Returns usage information for the current month.
     */
    async getUsageSummary(business) {
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
    async canCreateRecord(business) {
        const summary = await this.getUsage(business);
        if (summary.unlimited) {
            return true;
        }
        return summary.used < (summary.limit ?? 0);
    }
    /**
     * Throws if usage limit has been reached.
     */
    async ensureCanCreateRecord(business) {
        const allowed = await this.canCreateRecord(business);
        if (allowed) {
            return;
        }
        throw new UsageLimitReachedError();
    }
    /**
     * Internal helper.
     */
    async getUsage(business) {
        const [transactionCount, debtCount] = await Promise.all([
            this.transactionRepository.countRecordsThisMonth(business.id),
            this.debtRepository.countThisMonth(business.id)
        ]);
        const used = transactionCount + debtCount;
        const limit = UsageService.PLAN_LIMITS[business.plan] ?? null;
        return {
            plan: business.plan,
            used,
            limit,
            remaining: limit === null
                ? null
                : Math.max(0, limit - used),
            unlimited: limit === null
        };
    }
}
exports.UsageService = UsageService;
//# sourceMappingURL=UsageService.js.map