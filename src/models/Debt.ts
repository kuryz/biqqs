export type DebtStatus =
    | "open"
    | "paid";

export class Debt {

    constructor(
        public id: number,
        public businessId: number,
        public debtorName: string,
        public amount: number,
        public status: DebtStatus,
        public rawMessage: string,
        public createdAt: Date,
        public settledAt: Date | null
    ) {}

    public isOpen(): boolean {
        return this.status === "open";
    }

    public isPaid(): boolean {
        return this.status === "paid";
    }

    public markPaid(): void {
        this.status = "paid";
        this.settledAt = new Date();
    }

}