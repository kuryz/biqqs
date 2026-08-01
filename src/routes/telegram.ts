import { Router } from "express";

import { TelegramController } from "../controllers/TelegramController";

export function telegramRoutes(
    controller: TelegramController
): Router {

    const router = Router();

    /**
     * Telegram webhook endpoint.
     */
    router.post(
        "/webhook",
        async (req, res, next) => {

            try {

                await controller.handleUpdate(
                    req.body
                );

                res.sendStatus(200);

            } catch (error) {

                next(error);

            }

        }
    );

    return router;

}