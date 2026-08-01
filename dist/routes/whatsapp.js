"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappRoutes = whatsappRoutes;
const express_1 = require("express");
function whatsappRoutes(controller, verifyToken) {
    const router = (0, express_1.Router)();
    /**
     * Meta's one-time webhook verification handshake.
     * Registered as the "Callback URL" in the App Dashboard.
     */
    router.get("/webhook", (req, res) => {
        const { status, body } = controller.verify(req.query["hub.mode"], req.query["hub.verify_token"], req.query["hub.challenge"], verifyToken);
        res.status(status).send(body);
    });
    /**
     * Inbound message webhook.
     */
    router.post("/webhook", async (req, res, next) => {
        try {
            await controller.handleUpdate(req.body);
            // Meta expects a fast 200 regardless of processing outcome.
            res.sendStatus(200);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=whatsapp.js.map