"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
class Transaction {
    id;
    businessId;
    type;
    item;
    amount;
    rawMessage;
    createdAt;
    constructor(id, businessId, type, item, amount, rawMessage, createdAt) {
        this.id = id;
        this.businessId = businessId;
        this.type = type;
        this.item = item;
        this.amount = amount;
        this.rawMessage = rawMessage;
        this.createdAt = createdAt;
    }
    isSale() {
        return this.type === "sale";
    }
    isExpense() {
        return this.type === "expense";
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map