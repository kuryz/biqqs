/**
 * Thin adapter over the Meta WhatsApp Cloud API (Graph API).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
export class WhatsAppClient {

    constructor(
        private readonly token: string,
        private readonly phoneNumberId: string,
        private readonly apiVersion: string = "v20.0"
    ) {}

    private get apiUrl(): string {
        return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    }

    /**
     * Sends a plain-text WhatsApp message.
     * `to` is the recipient's WhatsApp ID (E.164 phone number, no '+').
     */
    public async sendMessage(
        to: string,
        text: string
    ): Promise<void> {

        const response = await fetch(
            this.apiUrl,
            {
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
            }
        );

        if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new Error(
                `WhatsApp API returned ${response.status}: ${body}`
            );
        }

    }

}
