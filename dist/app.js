"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const TelegramController_1 = require("./controllers/TelegramController");
const WhatsAppController_1 = require("./controllers/WhatsAppController");
const MessageController_1 = require("./controllers/MessageController");
const TelegramClient_1 = require("./channels/telegram/TelegramClient");
const WhatsAppClient_1 = require("./channels/whatsapp/WhatsAppClient");
const MessageParser_1 = require("./parsers/MessageParser");
const BusinessRepository_1 = require("./repositories/BusinessRepository");
const TransactionRepository_1 = require("./repositories/TransactionRepository");
const DebtRepository_1 = require("./repositories/DebtRepository");
const CacheService_1 = require("./services/CacheService");
const BusinessService_1 = require("./services/BusinessService");
const TransactionService_1 = require("./services/TransactionService");
const UsageService_1 = require("./services/UsageService");
const ReportService_1 = require("./services/ReportService");
const ReplyFormatter_1 = require("./views/ReplyFormatter");
const telegram_1 = require("./routes/telegram");
const whatsapp_1 = require("./routes/whatsapp");
const env_1 = require("./config/env");
class App {
    express;
    telegramController;
    whatsappController;
    constructor() {
        this.express = (0, express_1.default)();
        this.express.use(express_1.default.json());
        /**
         * Infrastructure
         */
        const cache = new CacheService_1.CacheService();
        /**
         * Repositories
         */
        const businessRepository = new BusinessRepository_1.BusinessRepository();
        const transactionRepository = new TransactionRepository_1.TransactionRepository(cache);
        const debtRepository = new DebtRepository_1.DebtRepository(cache);
        /**
         * Helpers
         */
        const formatter = new ReplyFormatter_1.ReplyFormatter();
        const parser = new MessageParser_1.MessageParser();
        /**
         * Services
         */
        const businessService = new BusinessService_1.BusinessService(businessRepository, cache);
        const transactionService = new TransactionService_1.TransactionService(transactionRepository, debtRepository, formatter);
        const reportService = new ReportService_1.ReportService(transactionRepository, debtRepository, formatter);
        const usageService = new UsageService_1.UsageService(transactionRepository, debtRepository);
        /**
         * Message handling (channel-agnostic)
         */
        const messageController = new MessageController_1.MessageController(parser, businessService, transactionService, reportService, usageService);
        /**
         * Channels
         *
         * Each channel is wired up only if it's configured via env vars,
         * so the app can run Telegram-only, WhatsApp-only, or both.
         */
        if (env_1.env.telegram.enabled) {
            const telegram = new TelegramClient_1.TelegramClient(env_1.env.telegram.token);
            this.telegramController =
                new TelegramController_1.TelegramController(telegram, messageController);
        }
        if (env_1.env.whatsapp.enabled) {
            const whatsapp = new WhatsAppClient_1.WhatsAppClient(env_1.env.whatsapp.token, env_1.env.whatsapp.phoneNumberId, env_1.env.whatsapp.apiVersion);
            this.whatsappController =
                new WhatsAppController_1.WhatsAppController(whatsapp, messageController);
        }
        if (!this.telegramController && !this.whatsappController) {
            throw new Error('No channel configured. Set TELEGRAM_BOT_TOKEN and/or ' +
                'WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID in .env.');
        }
        this.registerRoutes();
    }
    registerRoutes() {
        if (this.telegramController) {
            this.express.use('/telegram', (0, telegram_1.telegramRoutes)(this.telegramController));
        }
        if (this.whatsappController) {
            this.express.use('/whatsapp', (0, whatsapp_1.whatsappRoutes)(this.whatsappController, env_1.env.whatsapp.verifyToken));
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
exports.App = App;
//# sourceMappingURL=app.js.map