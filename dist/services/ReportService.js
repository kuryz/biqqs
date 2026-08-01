"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
class ReportService {
    repository;
    debtRepository;
    formatter;
    constructor(repository, debtRepository, formatter) {
        this.repository = repository;
        this.debtRepository = debtRepository;
        this.formatter = formatter;
    }
    async getSummary(business, bucket) {
        const summary = await this.repository.getSummary(business.id, bucket);
        return this.formatter.summary(bucket, summary);
    }
    async getOpenDebts(business) {
        const debts = await this.debtRepository.getOpenDebts(business.id);
        return this.formatter.openDebts(debts);
    }
}
exports.ReportService = ReportService;
//# sourceMappingURL=ReportService.js.map