"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppClient = void 0;
/**
 * Thin adapter over the Meta WhatsApp Cloud API (Graph API).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
class WhatsAppClient {
    token;
    phoneNumberId;
    apiVersion;
    constructor(token, phoneNumberId, apiVersion = "v20.0") {
        this.token = token;
        this.phoneNumberId = phoneNumberId;
        this.apiVersion = apiVersion;
    }
    get apiUrl() {
        return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    }
    /**
     * Sends a plain-text WhatsApp message.
     * `to` is the recipient's WhatsApp ID (E.164 phone number, no '+').
     */
    async sendMessage(to, text) {
        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.token}`
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to,
                type: "text",
                text: { body: text }
            })
        });
        if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(`WhatsApp API returned ${response.status}: ${body}`);
        }
    }
}
exports.WhatsAppClient = WhatsAppClient;
//# sourceMappingURL=WhatsAppClient.js.map