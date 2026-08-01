"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageController = void 0;
const UsageService_1 = require("../services/UsageService");
class MessageController {
    parser;
    businessService;
    transactionService;
    reportService;
    usageService;
    constructor(parser, businessService, transactionService, reportService, usageService) {
        this.parser = parser;
        this.businessService = businessService;
        this.transactionService = transactionService;
        this.reportService = reportService;
        this.usageService = usageService;
    }
    /**
     * Channel-agnostic entry point. Telegram, WhatsApp, or any future
     * channel all funnel through here with just a chat id and raw text.
     */
    async handle(chatId, incomingText, channel = 'telegram') {
        // Get (or create) the business attached to this chat.
        const business = await this.businessService.getOrCreateBusiness(chatId, channel);
        // Parse the user's message.
        const parsed = this.parser.parse(incomingText);
        try {
            return await this.route(business, parsed, channel);
        }
        catch (error) {
            if (error instanceof UsageService_1.UsageLimitReachedError) {
                return this.limitReachedMessage();
            }
            throw error;
        }
    }
    async route(business, parsed, channel) {
        switch (parsed.type) {
            case 'sale':
                await this.usageService.ensureCanCreateRecord(business);
                return this.transactionService.recordSale(business, parsed);
            case 'expense':
                await this.usageService.ensureCanCreateRecord(business);
                return this.transactionService.recordExpense(business, parsed);
            case 'debt_new':
                await this.usageService.ensureCanCreateRecord(business);
                return this.transactionService.recordDebt(business, parsed);
            case 'debt_paid':
                return this.transactionService.markDebtPaid(business, parsed);
            case "query":
                switch (parsed.key) {
                    case "today":
                        return this.reportService.getSummary(business, "today");
                    case "week":
                        return this.reportService.getSummary(business, "week");
                    case "month":
                        return this.reportService.getSummary(business, "month");
                    case "debts":
                        return this.reportService.getOpenDebts(business);
                    case "usage":
                        return this.usageService.getUsageSummary(business);
                    case "help":
                    default:
                        return this.helpMessage();
                }
            case 'admin_upgrade':
                return this.businessService.adminUpgrade(parsed.targetChatId, parsed.token, channel);
            default:
                return this.helpMessage();
        }
    }
    limitReachedMessage() {
        return `🚫 You've hit your free plan's monthly limit.
    Reply "usage" to see your numbers, or upgrade for unlimited records.`.trim();
    }
    helpMessage() {
        return `I couldn't understand that.
    Examples: Sold Rice 5000
    Bought Fuel 3500
    John owes 15000
    John has paid
    Today
    Week
    Month
    Debts
    Usage`.trim();
    }
}
exports.MessageController = MessageController;
//# sourceMappingURL=MessageController.js.map