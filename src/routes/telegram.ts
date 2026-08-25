import { Router } from "express";
import { TelegramController } from "../controllers/TelegramController";

export function telegramRoutes(
    controller: TelegramController
): Router {
    const router = Router();

    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!webhookSecret) {
        throw new Error(
            "TELEGRAM_WEBHOOK_SECRET environment variable is not configured"
        );
    }

    /**
     * Telegram webhook endpoint.
     */
    router.post(
        "/webhook",
        async (req, res, next) => {
            try {
                const secretToken =
                    req.headers["x-telegram-bot-api-secret-token"];

                if (secretToken !== webhookSecret) {
                    res.sendStatus(403);
                    return;
                }

                await controller.handleUpdate(req.body);

                res.sendStatus(200);
            } catch (error) {
                next(error);
            }
        }
    );

    return router;
}
