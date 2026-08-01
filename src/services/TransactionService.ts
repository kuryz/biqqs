import { Business } from '../types';
import { SaleMessage, ExpenseMessage, DebtMessage, DebtPaidMessage } from '../types';

import { TransactionRepository } from '../repositories/TransactionRepository';
import { DebtRepository } from '../repositories/DebtRepository';
import { ReplyFormatter } from '../views/ReplyFormatter';

export class TransactionService {

    constructor(
        private readonly repository: TransactionRepository,
        private readonly debtRepository: DebtRepository,
        private readonly formatter: ReplyFormatter
    ){}

    async recordSale(
        business:Business,
        message:SaleMessage
    ){

        await this.repository.addTransaction(
            business.id,
            "sale",
            message.item ?? null,
            message.amount,
            message.raw
        );

        return this.formatter.saleRecorded(
            message.amount,
            message.item
        );

    }

    async recordExpense(
        business:Business,
        message:ExpenseMessage
    ){

        await this.repository.addTransaction(
            business.id,
            "expense",
            message.item ?? null,
            message.amount,
            message.raw
        );

        return this.formatter.expenseRecorded(
            message.amount,
            message.item
        );

    }

    async recordDebt(
        business: Business,
        message: DebtMessage
    ) {

        await this.debtRepository.create(
            business.id,
            message.debtorName,
            message.amount,
            message.raw
        );

        return this.formatter.debtRecorded(
            message.debtorName,
            message.amount
        );

    }

    async markDebtPaid(
        business: Business,
        message: DebtPaidMessage
    ) {

        const affected = await this.debtRepository.markPaid(
            business.id,
            message.debtorName
        );

        if (affected === 0) {
            return `I couldn't find an open debt for "${message.debtorName}".`;
        }

        return this.formatter.debtPaid(message.debtorName);

    }

}
