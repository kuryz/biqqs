"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageParser = void 0;
class MessageParser {
    static SALE_WORDS = /\b(sold|sale|solod|sol|sales)\b/i;
    static EXPENSE_WORDS = /\b(bought|paid|spent|expense|purchase|purchsed)\b/i;
    static DEBT_WORDS = /\b(credit|owes|owe|owing)\b/i;
    static PAID_DEBT_WORDS = /\b(paid up|cleared|settled|debt paid|has paid)\b/i;
    static ADMIN_UPGRADE_RE = /^\s*\/admin_upgrade\s+(\S+)\s+(\S+)\s*$/i;
    static QUERY_PATTERNS = [
        { re: /^\s*(today)\s*$/i, key: 'today' },
        { re: /^\s*(this week|week)\s*$/i, key: 'week' },
        { re: /^\s*(this month|month)\s*$/i, key: 'month' },
        { re: /^\s*(who owes me|debtors|debts)\s*$/i, key: 'debts' },
        { re: /^\s*(help|menu|start)\s*$/i, key: 'help' },
        { re: /^\s*(usage|plan|status|my plan|subscription)\s*$/i, key: 'usage' },
    ];
    /**
     * Nigerian traders usually place the selling price last.
     *
     * Examples:
     *  sold 3 bags rice 15000
     *  bought 2 soap 5k
     */
    parseAmount(text) {
        const regex = /(?:₦|NGN|\bN(?=\d))?\s*([\d,]+(?:\.\d+)?)\s*(k)?/gi;
        let match;
        let lastAmount = null;
        while ((match = regex.exec(text)) !== null) {
            let amount = parseFloat(match[1].replace(/,/g, ''));
            if (isNaN(amount)) {
                continue;
            }
            if (match[2]) {
                amount *= 1000;
            }
            lastAmount = amount;
        }
        return lastAmount;
    }
    extractDebtorName(text) {
        const cleaned = text
            .replace(MessageParser.DEBT_WORDS, '')
            .replace(/\d[\d,.]*k?/gi, '')
            .replace(/₦|\bNGN\b/gi, '')
            .trim();
        return cleaned.split(/\s+/)[0] || 'Unknown';
    }
    extractItem(text) {
        const cleaned = text
            .replace(MessageParser.SALE_WORDS, '')
            .replace(MessageParser.EXPENSE_WORDS, '')
            .replace(/\d[\d,.]*k?/gi, '')
            .replace(/₦|\bNGN\b/gi, '')
            .trim();
        return cleaned || null;
    }
    parse(rawText) {
        const text = rawText.trim();
        const adminMatch = text.match(MessageParser.ADMIN_UPGRADE_RE);
        if (adminMatch) {
            return {
                type: 'admin_upgrade',
                targetChatId: adminMatch[1],
                token: adminMatch[2],
            };
        }
        for (const query of MessageParser.QUERY_PATTERNS) {
            if (query.re.test(text)) {
                return {
                    type: 'query',
                    key: query.key,
                };
            }
        }
        if (MessageParser.PAID_DEBT_WORDS.test(text)) {
            return {
                type: 'debt_paid',
                debtorName: this.extractDebtorName(text.replace(MessageParser.PAID_DEBT_WORDS, '')),
                raw: rawText,
            };
        }
        if (MessageParser.DEBT_WORDS.test(text)) {
            const amount = this.parseAmount(text);
            if (amount) {
                return {
                    type: 'debt_new',
                    amount,
                    debtorName: this.extractDebtorName(text),
                    raw: rawText,
                };
            }
        }
        if (MessageParser.SALE_WORDS.test(text)) {
            const amount = this.parseAmount(text);
            if (amount) {
                return {
                    type: 'sale',
                    amount,
                    item: this.extractItem(text),
                    raw: rawText,
                };
            }
        }
        if (MessageParser.EXPENSE_WORDS.test(text)) {
            const amount = this.parseAmount(text);
            if (amount) {
                return {
                    type: 'expense',
                    amount,
                    item: this.extractItem(text),
                    raw: rawText,
                };
            }
        }
        return {
            type: 'unrecognized',
            raw: rawText,
        };
    }
}
exports.MessageParser = MessageParser;
//# sourceMappingURL=MessageParser.js.map