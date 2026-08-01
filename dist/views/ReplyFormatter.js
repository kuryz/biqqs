"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplyFormatter = void 0;
class ReplyFormatter {
    saleRecorded(amount, item) {
        return `✅ Sale recorded
        Item: ${item ?? "-"}
        Amount: ₦${amount.toLocaleString()}`;
    }
    expenseRecorded(amount, item) {
        return `💸 Expense recorded
        Item: ${item ?? "-"}
        Amount: ₦${amount.toLocaleString()}`;
    }
    debtRecorded(debtor, amount) {
        return `📒 Credit sale recorded

${debtor}

₦${amount.toLocaleString()}`;
    }
    debtPaid(debtor) {
        return `✅ ${debtor} marked as paid`;
    }
    unknown() {
        return `I couldn't understand that message.
        Examples
        Sold Rice 15000
        Bought Fuel 5000
        John owes 12000
        Today
        Week
        Month`;
    }
    summary(bucket, summary) {
        const sales = Number(summary.sales.total);
        const expenses = Number(summary.expenses.total);
        const profit = sales - expenses;
        return `
            📊 ${bucket.toUpperCase()} REPORT

            Sales: ₦${sales.toLocaleString()}
            Transactions: ${summary.sales.count}

            Expenses: ₦${expenses.toLocaleString()}
            Transactions: ${summary.expenses.count}

            Profit: ₦${profit.toLocaleString()}
            `.trim();
    }
    openDebts(debts) {
        if (!debts.length) {
            return "🎉 Nobody owes you.";
        }
        let total = 0;
        const lines = debts.map(debt => {
            total += Number(debt.amount);
            return `• ${debt.debtorName} — ₦${Number(debt.amount).toLocaleString()}`;
        });
        return `📒 OPEN DEBTS
        ${lines.join("\n")}
        Outstanding: ₦${total.toLocaleString()}`.trim();
    }
}
exports.ReplyFormatter = ReplyFormatter;
//# sourceMappingURL=ReplyFormatter.js.map