import { Router } from "express";

import { WhatsAppController } from "../controllers/WhatsAppController";

export function whatsappRoutes(
    controller: WhatsAppController,
    verifyToken: string
): Router {

    const router = Router();

    /**
     * Meta's one-time webhook verification handshake.
     * Registered as the "Callback URL" in the App Dashboard.
     */
    router.get(
        "/webhook",
        (req, res) => {

            const { status, body } = controller.verify(
                req.query["hub.mode"] as string | undefined,
                req.query["hub.verify_token"] as string | undefined,
                req.query["hub.challenge"] as string | undefined,
                verifyToken
            );

            res.status(status).send(body);

        }
    );

    /**
     * Inbound message webhook.
     */
    router.post(
        "/webhook",
        async (req, res, next) => {

            try {

                await controller.handleUpdate(req.body);

                // Meta expects a fast 200 regardless of processing outcome.
                res.sendStatus(200);

            } catch (error) {

                next(error);

            }

        }
    );

    return router;

}
