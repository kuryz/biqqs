"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
class TransactionService {
    repository;
    debtRepository;
    formatter;
    constructor(repository, debtRepository, formatter) {
        this.repository = repository;
        this.debtRepository = debtRepository;
        this.formatter = formatter;
    }
    async recordSale(business, message) {
        await this.repository.addTransaction(business.id, "sale", message.item ?? null, message.amount, message.raw);
        return this.formatter.saleRecorded(message.amount, message.item);
    }
    async recordExpense(business, message) {
        await this.repository.addTransaction(business.id, "expense", message.item ?? null, message.amount, message.raw);
        return this.formatter.expenseRecorded(message.amount, message.item);
    }
    async recordDebt(business, message) {
        await this.debtRepository.create(business.id, message.debtorName, message.amount, message.raw);
        return this.formatter.debtRecorded(message.debtorName, message.amount);
    }
    async markDebtPaid(business, message) {
        const affected = await this.debtRepository.markPaid(business.id, message.debtorName);
        if (affected === 0) {
            return `I couldn't find an open debt for "${message.debtorName}".`;
        }
        return this.formatter.debtPaid(message.debtorName);
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map