"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramRoutes = telegramRoutes;
const express_1 = require("express");
function telegramRoutes(controller) {
    const router = (0, express_1.Router)();
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error("TELEGRAM_WEBHOOK_SECRET environment variable is not configured");
    }
    /**
     * Telegram webhook endpoint.
     */
    router.post("/webhook", async (req, res, next) => {
        try {
            const secretToken = req.headers["x-telegram-bot-api-secret-token"];
            if (secretToken !== webhookSecret) {
                res.sendStatus(403);
                return;
            }
            await controller.handleUpdate(req.body);
            res.sendStatus(200);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=telegram.js.map