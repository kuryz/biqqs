"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Usage = void 0;
class Usage {
    plan;
    used;
    limit;
    constructor(plan, used, limit) {
        this.plan = plan;
        this.used = used;
        this.limit = limit;
    }
    get unlimited() {
        return this.limit === null;
    }
    get remaining() {
        if (this.limit === null) {
            return null;
        }
        return Math.max(0, this.limit - this.used);
    }
    canCreateRecord() {
        if (this.unlimited) {
            return true;
        }
        return this.used < (this.limit ?? 0);
    }
}
exports.Usage = Usage;
//# sourceMappingURL=Usage.js.map