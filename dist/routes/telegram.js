"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramRoutes = telegramRoutes;
const express_1 = require("express");
function telegramRoutes(controller) {
    const router = (0, express_1.Router)();
    /**
     * Telegram webhook endpoint.
     */
    router.post("/webhook", async (req, res, next) => {
        try {
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