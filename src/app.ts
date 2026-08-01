import express, { Application } from 'express';

import { TelegramController } from './controllers/TelegramController';
import { WhatsAppController } from './controllers/WhatsAppController';
import { MessageController } from './controllers/MessageController';

import { TelegramClient } from './channels/telegram/TelegramClient';
import { WhatsAppClient } from './channels/whatsapp/WhatsAppClient';

import { MessageParser } from './parsers/MessageParser';

import { BusinessRepository } from './repositories/BusinessRepository';
import { TransactionRepository } from './repositories/TransactionRepository';
import { DebtRepository } from './repositories/DebtRepository';

import { CacheService } from './services/CacheService';
import { BusinessService } from './services/BusinessService';
import { TransactionService } from './services/TransactionService';
import { UsageService } from './services/UsageService';
import { ReportService } from './services/ReportService';

import { ReplyFormatter } from './views/ReplyFormatter';
import { telegramRoutes } from './routes/telegram';
import { whatsappRoutes } from './routes/whatsapp';

import { env } from './config/env';

export class App {

    public readonly express: Application;

    public readonly telegramController?: TelegramController;
    public readonly whatsappController?: WhatsAppController;

    constructor() {

        this.express = express();

        this.express.use(express.json());

        /**
         * Infrastructure
         */

        const cache = new CacheService();

        /**
         * Repositories
         */

        const businessRepository =
            new BusinessRepository();

        const transactionRepository =
            new TransactionRepository(cache);

        const debtRepository =
            new DebtRepository(cache);

        /**
         * Helpers
         */

        const formatter =
            new ReplyFormatter();

        const parser =
            new MessageParser();

        /**
         * Services
         */

        const businessService =
            new BusinessService(
                businessRepository,
                cache
            );

        const transactionService =
            new TransactionService(
                transactionRepository,
                debtRepository,
                formatter
            );

        const reportService =
            new ReportService(
                transactionRepository,
                debtRepository,
                formatter
            );

        const usageService =
            new UsageService(
                transactionRepository,
                debtRepository
            );

        /**
         * Message handling (channel-agnostic)
         */

        const messageController =
            new MessageController(
                parser,
                businessService,
                transactionService,
                reportService,
                usageService
            );

        /**
         * Channels
         *
         * Each channel is wired up only if it's configured via env vars,
         * so the app can run Telegram-only, WhatsApp-only, or both.
         */

        if (env.telegram.enabled) {

            const telegram =
                new TelegramClient(
                    env.telegram.token
                );

            this.telegramController =
                new TelegramController(
                    telegram,
                    messageController
                );

        }

        if (env.whatsapp.enabled) {

            const whatsapp =
                new WhatsAppClient(
                    env.whatsapp.token,
                    env.whatsapp.phoneNumberId,
                    env.whatsapp.apiVersion
                );

            this.whatsappController =
                new WhatsAppController(
                    whatsapp,
                    messageController
                );

        }

        if (!this.telegramController && !this.whatsappController) {
            throw new Error(
                'No channel configured. Set TELEGRAM_BOT_TOKEN and/or ' +
                'WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID in .env.'
            );
        }

        this.registerRoutes();

    }

    private registerRoutes(): void {

        if (this.telegramController) {
            this.express.use(
                '/telegram',
                telegramRoutes(this.telegramController)
            );
        }

        if (this.whatsappController) {
            this.express.use(
                '/whatsapp',
                whatsappRoutes(
                    this.whatsappController,
                    env.whatsapp.verifyToken
                )
            );
        }

        /**
         * Health check
         */

        this.express.get('/health', (_, res) => {
            res.json({
                status: 'ok',
                channels: {
                    telegram: Boolean(this.telegramController),
                    whatsapp: Boolean(this.whatsappController)
                }
            });
        });
    }

}
