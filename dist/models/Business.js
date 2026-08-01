"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Business = void 0;
const BaseModel_1 = require("./BaseModel");
class Business extends BaseModel_1.BaseModel {
    id;
    chatId;
    channel;
    businessName;
    plan;
    createdAt;
    constructor(id, chatId, channel, businessName, plan, createdAt) {
        super(id, createdAt);
        this.id = id;
        this.chatId = chatId;
        this.channel = channel;
        this.businessName = businessName;
        this.plan = plan;
        this.createdAt = createdAt;
    }
    isFreePlan() {
        return this.plan === "free";
    }
    isProPlan() {
        return this.plan === "pro";
    }
    upgrade(plan) {
        this.plan = plan;
    }
}
exports.Business = Business;
//# sourceMappingURL=Business.js.map