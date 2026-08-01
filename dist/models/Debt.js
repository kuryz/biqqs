"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debt = void 0;
class Debt {
    id;
    businessId;
    debtorName;
    amount;
    status;
    rawMessage;
    createdAt;
    settledAt;
    constructor(id, businessId, debtorName, amount, status, rawMessage, createdAt, settledAt) {
        this.id = id;
        this.businessId = businessId;
        this.debtorName = debtorName;
        this.amount = amount;
        this.status = status;
        this.rawMessage = rawMessage;
        this.createdAt = createdAt;
        this.settledAt = settledAt;
    }
    isOpen() {
        return this.status === "open";
    }
    isPaid() {
        return this.status === "paid";
    }
    markPaid() {
        this.status = "paid";
        this.settledAt = new Date();
    }
}
exports.Debt = Debt;
//# sourceMappingURL=Debt.js.map