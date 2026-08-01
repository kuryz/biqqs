import { Business, Channel } from "../models/Business";
import { Debt } from "../models/Debt";
import { TransactionType } from "../models/Transaction";

/**
 * =====================================
 * Parser
 * =====================================
 */

export interface SaleMessage {
    type: "sale";
    amount: number;
    item: string | null;
    raw: string;
}

export interface ExpenseMessage {
    type: "expense";
    amount: number;
    item: string | null;
    raw: string;
}

export interface DebtMessage {
    type: "debt_new";
    debtorName: string;
    amount: number;
    raw: string;
}

export interface DebtPaidMessage {
    type: "debt_paid";
    debtorName: string;
    raw: string;
}

export interface QueryMessage {
    type: "query";
    key: QueryType;
}

export interface AdminUpgradeMessage {
    type: "admin_upgrade";
    targetChatId: string;
    token: string;
}

export interface UnrecognizedMessage {
    type: "unrecognized";
    raw: string;
}

export type ParsedMessage =
    | SaleMessage
    | ExpenseMessage
    | DebtMessage
    | DebtPaidMessage
    | QueryMessage
    | AdminUpgradeMessage
    | UnrecognizedMessage;

/**
 * =====================================
 * Queries
 * =====================================
 */

export type QueryType =
    | "today"
    | "week"
    | "month"
    | "debts"
    | "help"
    | "usage";

/**
 * =====================================
 * Reports
 * =====================================
 */

export interface SummaryBucket {
    total: number;
    count: number;
}

export interface Summary {
    sales: SummaryBucket;
    expenses: SummaryBucket;
}

/**
 * =====================================
 * Incoming Channels
 * =====================================
 */

export interface IncomingMessage {
    channel: Channel;
    chatId: string;
    senderId: string;
    senderName?: string;
    text: string;
    timestamp: Date;
}

/**
 * =====================================
 * Telegram
 * =====================================
 */

export interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        text?: string;
        date: number;
        chat: {
            id: number;
            type: string;
        };
        from?: {
            id: number;
            username?: string;
            first_name?: string;
            last_name?: string;
        };
    };
}

/**
 * =====================================
 * WhatsApp
 * =====================================
 */

export interface WhatsAppWebhook {
    object: string;
    entry: unknown[];
}

/**
 * =====================================
 * Repository DTOs
 * =====================================
 */

export interface CreateTransactionDTO {
    businessId: number;
    type: TransactionType;
    item: string | null;
    amount: number;
    rawMessage: string;
}

export interface CreateDebtDTO {
    businessId: number;
    debtorName: string;
    amount: number;
    rawMessage: string;
}

/**
 * =====================================
 * Service Responses
 * =====================================
 */

export interface UsageSummary {
    plan: string;
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited: boolean;
}

/**
 * =====================================
 * Exports
 * =====================================
 */
export type {
    Business,
    Channel,
    Debt,
    TransactionType
};