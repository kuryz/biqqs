import { MessageController } from './MessageController';
import { TelegramClient } from '../channels/telegram/TelegramClient';

export interface TelegramMessage {
    message?: {
        message_id: number;
        chat: {
            id: number;
        };
        from?: {
            id: number;
            username?: string;
            first_name?: string;
        };
        text?: string;
    };
}

export class TelegramController {

    constructor(
        private readonly telegram: TelegramClient,
        private readonly messageController: MessageController
    ) {}

    /**
     * Entry point for Telegram webhook/polling updates.
     */
    public async handleUpdate(
        update: TelegramMessage
    ): Promise<void> {

        if (!update.message) {
            return;
        }

        const text = update.message.text?.trim();

        if (!text) {
            return;
        }

        const chatId = String(update.message.chat.id);

        try {

            const reply = await this.messageController.handle(
                chatId,
                text,
                "telegram"
            );

            await this.telegram.sendMessage(
                chatId,
                reply
            );

        } catch (error) {

            console.error(error);
            await this.telegram.sendMessage(
                chatId,
                "An unexpected error occurred. Please try again."
            );

        }

    }

}