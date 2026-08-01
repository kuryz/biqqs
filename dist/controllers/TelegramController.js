"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramController = void 0;
class TelegramController {
    telegram;
    messageController;
    constructor(telegram, messageController) {
        this.telegram = telegram;
        this.messageController = messageController;
    }
    /**
     * Entry point for Telegram webhook/polling updates.
     */
    async handleUpdate(update) {
        if (!update.message) {
            return;
        }
        const text = update.message.text?.trim();
        if (!text) {
            return;
        }
        const chatId = String(update.message.chat.id);
        try {
            const reply = await this.messageController.handle(chatId, text, "telegram");
            await this.telegram.sendMessage(chatId, reply);
        }
        catch (error) {
            console.error(error);
            await this.telegram.sendMessage(chatId, "An unexpected error occurred. Please try again.");
        }
    }
}
exports.TelegramController = TelegramController;
//# sourceMappingURL=TelegramController.js.map