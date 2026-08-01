import { Business } from "../types";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { DebtRepository } from "../repositories/DebtRepository";
import { ReplyFormatter } from "../views/ReplyFormatter";

export type ReportBucket =
    | "today"
    | "week"
    | "month";

export class ReportService {

    constructor(
        private readonly repository: TransactionRepository,
        private readonly debtRepository: DebtRepository,
        private readonly formatter: ReplyFormatter
    ) {}

    public async getSummary(
        business: Business,
        bucket: ReportBucket
    ): Promise<string> {

        const summary = await this.repository.getSummary(
            business.id,
            bucket
        );

        return this.formatter.summary(
            bucket,
            summary
        );

    }

    public async getOpenDebts(
        business: Business
    ): Promise<string> {

        const debts = await this.debtRepository.getOpenDebts(
            business.id
        );

        return this.formatter.openDebts(
            debts
        );

    }

}
