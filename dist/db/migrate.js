"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool_1 = require("./pool");
/**
 * Creates the businesses / transactions / debts tables if they don't
 * already exist. Safe to run repeatedly.
 */
async function migrate() {
    await pool_1.pool.query(`
        CREATE TABLE IF NOT EXISTS businesses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chat_id VARCHAR(64) NOT NULL,
            channel VARCHAR(16) NOT NULL DEFAULT 'telegram',
            business_name VARCHAR(255) NULL,
            plan VARCHAR(16) NOT NULL DEFAULT 'free',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_channel_chat (channel, chat_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool_1.pool.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            business_id INT NOT NULL,
            type ENUM('sale', 'expense') NOT NULL,
            item VARCHAR(255) NULL,
            amount DECIMAL(14,2) NOT NULL,
            raw_message TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_business_created (business_id, created_at),
            CONSTRAINT fk_transactions_business
                FOREIGN KEY (business_id) REFERENCES businesses(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    await pool_1.pool.query(`
        CREATE TABLE IF NOT EXISTS debts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            business_id INT NOT NULL,
            debtor_name VARCHAR(255) NOT NULL,
            amount DECIMAL(14,2) NOT NULL,
            status ENUM('open', 'paid') NOT NULL DEFAULT 'open',
            raw_message TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            settled_at TIMESTAMP NULL,
            INDEX idx_business_status (business_id, status),
            INDEX idx_business_created (business_id, created_at),
            CONSTRAINT fk_debts_business
                FOREIGN KEY (business_id) REFERENCES businesses(id)
                ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log("✅ Migration complete: businesses, transactions, debts");
}
migrate()
    .catch(error => {
    console.error("❌ Migration failed:", error);
    process.exitCode = 1;
})
    .finally(async () => {
    await pool_1.database.disconnect();
});
//# sourceMappingURL=migrate.js.map