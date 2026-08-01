import { MessageController } from './MessageController';
import { WhatsAppClient } from '../channels/whatsapp/WhatsAppClient';

/**
 * Shape of a Meta WhatsApp Cloud API webhook POST body.
 * https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
 */
export interface WhatsAppWebhookPayload {
    object?: string;
    entry?: Array<{
        id: string;
        changes: Array<{
            field: string;
            value: {
                messaging_product: string;
                metadata: {
                    display_phone_number: string;
                    phone_number_id: string;
                };
                contacts?: Array<{
                    wa_id: string;
                    profile?: { name?: string };
                }>;
                messages?: Array<{
                    from: string;
                    id: string;
                    timestamp: string;
                    type: string;
                    text?: { body: string };
                }>;
            };
        }>;
    }>;
}

export class WhatsAppController {

    constructor(
        private readonly whatsapp: WhatsAppClient,
        private readonly messageController: MessageController
    ) {}

    /**
     * GET /whatsapp/webhook - verification handshake Meta performs once
     * when you register the callback URL in the App Dashboard.
     */
    public verify(
        mode: string | undefined,
        token: string | undefined,
        challenge: string | undefined,
        expectedVerifyToken: string
    ): { status: number; body: string } {

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
    public async handleUpdate(
        payload: WhatsAppWebhookPayload
    ): Promise<void> {

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

                const reply = await this.messageController.handle(
                    chatId,
                    text,
                    "whatsapp"
                );

                await this.whatsapp.sendMessage(
                    chatId,
                    reply
                );

            } catch (error) {

                console.error(error);

                await this.whatsapp.sendMessage(
                    chatId,
                    "An unexpected error occurred. Please try again."
                );

            }

        }

    }

    private extractMessages(
        payload: WhatsAppWebhookPayload
    ): Array<{
        from: string;
        id: string;
        timestamp: string;
        type: string;
        text?: { body: string };
    }> {

        const messages: Array<{
            from: string;
            id: string;
            timestamp: string;
            type: string;
            text?: { body: string };
        }> = [];

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
