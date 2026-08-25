"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramClient = void 0;
class TelegramClient {
    token;
    constructor(token) {
        this.token = token;
    }
    get apiUrl() {
        return `https://api.telegram.org/bot${this.token}`;
    }
    async sendMessage(chatId, text) {
        const response = await fetch(`${this.apiUrl}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text
            })
        });
        const data = await response.json();
        if (!response.ok) {
            const error = data;
            console.error("Telegram API error:", error);
            throw new Error(`Telegram API returned ${response.status}: ${error.description ?? "Unknown error"}`);
        }
    }
}
exports.TelegramClient = TelegramClient;
//# sourceMappingURL=TelegramClient.js.map