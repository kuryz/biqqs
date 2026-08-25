export class TelegramClient {

    constructor(
        private readonly token: string
    ) {}

    private get apiUrl(): string {
        return `https://api.telegram.org/bot${this.token}`;
    }

    public async sendMessage(
        chatId: string,
        text: string
    ): Promise<void> {

        const response = await fetch(
            `${this.apiUrl}/sendMessage`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Telegram API returned ${response.status}`);
        }

    }

}