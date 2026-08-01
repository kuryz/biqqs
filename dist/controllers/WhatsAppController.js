"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppController = void 0;
class WhatsAppController {
    whatsapp;
    messageController;
    constructor(whatsapp, messageController) {
        this.whatsapp = whatsapp;
        this.messageController = messageController;
    }
    /**
     * GET /whatsapp/webhook - verification handshake Meta performs once
     * when you register the callback URL in the App Dashboard.
     */
    verify(mode, token, challenge, expectedVerifyToken) {
        if (mode === "subscribe" && token === expectedVerifyToken && challenge) {
            return { status: 200, body: challenge };
        }
        return { status: 403, body: "Verification failed" };
    }
    /**
     * POST /whatsapp/webhook - entry point for inbound messages.
     * Meta batches updates, so a single payload can contain several
     * messages across several "changes" - we process all of them.
     */
    async handleUpdate(payload) {
        const messages = this.extractMessages(payload);
        for (const message of messages) {
            const text = message.text?.body?.trim();
            if (!text) {
                // Non-text message (image, audio, location, etc).
                // Not handled yet - skip rather than crash.
                continue;
            }
            const chatId = message.from;
            try {
                const reply = await this.messageController.handle(chatId, text, "whatsapp");
                await this.whatsapp.sendMessage(chatId, reply);
            }
            catch (error) {
                console.error(error);
                await this.whatsapp.sendMessage(chatId, "An unexpected error occurred. Please try again.");
            }
        }
    }
    extractMessages(payload) {
        const messages = [];
        for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
                for (const message of change.value.messages ?? []) {
                    messages.push(message);
                }
            }
        }
        return messages;
    }
}
exports.WhatsAppController = WhatsAppController;
//# sourceMappingURL=WhatsAppController.js.map