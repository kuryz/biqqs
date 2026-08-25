interface TelegramApiResponse {
    ok: boolean;
    error_code?: number;
    description?: string;
}

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

        const data: unknown = await response.json();

        if (!response.ok) {
            const error = data as TelegramApiResponse;
            console.error("Telegram API error:", error);

            throw new Error(
                `Telegram API returned ${response.status}: ${
                    error.description ?? "Unknown error"
                }`
            );
        }

    }

}