import { MessageParser } from '../parsers/MessageParser';
import { BusinessService } from '../services/BusinessService';
import { TransactionService } from '../services/TransactionService';
import { ReportService } from '../services/ReportService';
import { UsageService, UsageLimitReachedError } from '../services/UsageService';

import { ParsedMessage, Channel } from '../types';

export class MessageController {
    constructor(
        private readonly parser: MessageParser,
        private readonly businessService: BusinessService,
        private readonly transactionService: TransactionService,
        private readonly reportService: ReportService,
        private readonly usageService: UsageService
    ){}

  /**
   * Channel-agnostic entry point. Telegram, WhatsApp, or any future
   * channel all funnel through here with just a chat id and raw text.
   */
  public async handle(
    chatId: string,
    incomingText: string,
    channel: Channel = 'telegram'
  ): Promise<string> {

    // Get (or create) the business attached to this chat.
    const business =
      await this.businessService.getOrCreateBusiness(chatId, channel);

    // Parse the user's message.
    const parsed: ParsedMessage =
      this.parser.parse(incomingText);

    try {
      return await this.route(business, parsed, channel);
    } catch (error) {
      if (error instanceof UsageLimitReachedError) {
        return this.limitReachedMessage();
      }
      throw error;
    }

  }

  private async route(
    business: Awaited<ReturnType<BusinessService["getOrCreateBusiness"]>>,
    parsed: ParsedMessage,
    channel: Channel
  ): Promise<string> {

    switch (parsed.type) {

      case 'sale':
        await this.usageService.ensureCanCreateRecord(
            business
        );
        return this.transactionService.recordSale(
          business,
          parsed
        );

      case 'expense':
        await this.usageService.ensureCanCreateRecord(
            business
        );
        return this.transactionService.recordExpense(
          business,
          parsed
        );

      case 'debt_new':
        await this.usageService.ensureCanCreateRecord(
            business
        );
        return this.transactionService.recordDebt(
          business,
          parsed
        );

      case 'debt_paid':
        return this.transactionService.markDebtPaid(
          business,
          parsed
        );

      case "query":
        switch (parsed.key) {

          case "today":
            return this.reportService.getSummary(
              business,
              "today"
            );

          case "week":
            return this.reportService.getSummary(
              business,
              "week"
            );

          case "month":
            return this.reportService.getSummary(
              business,
              "month"
            );

          case "debts":
            return this.reportService.getOpenDebts(
              business
            );

          case "usage":
            return this.usageService.getUsageSummary(
              business
            );

          case "help":
          default:
            return this.helpMessage();

        }

      case 'admin_upgrade':
        return this.businessService.adminUpgrade(
          parsed.targetChatId,
          parsed.token,
          channel
        );

      default:
        return this.helpMessage();
    }
  }

  private limitReachedMessage(): string {
    return `🚫 You've hit your free plan's monthly limit.
    Reply "usage" to see your numbers, or upgrade for unlimited records.`.trim();
  }

  private helpMessage(): string {
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
