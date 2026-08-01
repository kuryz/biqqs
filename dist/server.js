"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const pool_1 = require("./db/pool");
const app = new app_1.App();
const port = Number(process.env.PORT) || 3000;
async function bootstrap() {
    await pool_1.database.connect();
    app.express.listen(port, () => {
        console.log(`🚀 Server running on ${port}`);
    });
}
bootstrap();
//# sourceMappingURL=server.js.map