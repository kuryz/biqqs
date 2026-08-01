export type TransactionType =
    | "sale"
    | "expense";

export class Transaction {

    constructor(
        public id: number,
        public businessId: number,
        public type: TransactionType,
        public item: string | null,
        public amount: number,
        public rawMessage: string,
        public createdAt: Date
    ) {}

    public isSale(): boolean {
        return this.type === "sale";
    }

    public isExpense(): boolean {
        return this.type === "expense";
    }

}