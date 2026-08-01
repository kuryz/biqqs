import { Debt, Summary } from "../types";

export class ReplyFormatter {

    saleRecorded(
        amount:number,
        item?:string|null
    ){

        return `✅ Sale recorded
        Item: ${item ?? "-"}
        Amount: ₦${amount.toLocaleString()}`;

    }

    expenseRecorded(
        amount:number,
        item?:string|null
    ){

        return `💸 Expense recorded
        Item: ${item ?? "-"}
        Amount: ₦${amount.toLocaleString()}`;

    }

    debtRecorded(
        debtor:string,
        amount:number
    ){

        return `📒 Credit sale recorded

${debtor}

₦${amount.toLocaleString()}`;

    }

    debtPaid(debtor:string){
        return `✅ ${debtor} marked as paid`;
    }

    unknown(){
        return `I couldn't understand that message.
        Examples
        Sold Rice 15000
        Bought Fuel 5000
        John owes 12000
        Today
        Week
        Month`;
    }

    summary(bucket: string,summary: Summary): string {
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

    openDebts(debts: Debt[]): string {
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
