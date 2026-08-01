import { BaseModel } from "./BaseModel";

export type Channel = "telegram" | "whatsapp";

export class Business extends BaseModel {

    constructor(
        public id: number,
        public chatId: string,
        public channel: Channel,
        public businessName: string | null,
        public plan: string,
        public createdAt: Date
    ) {super(id, createdAt);}

    public isFreePlan(): boolean {
        return this.plan === "free";
    }

    public isProPlan(): boolean {
        return this.plan === "pro";
    }

    public upgrade(plan: string): void {
        this.plan = plan;
    }

}