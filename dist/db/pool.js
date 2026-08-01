"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.database = exports.pool = void 0;
const promise_1 = require("mysql2/promise");
const env_1 = require("../config/env");
class Database {
    pool;
    constructor() {
        this.pool = (0, promise_1.createPool)({
            host: env_1.env.mysql.host,
            port: env_1.env.mysql.port,
            user: env_1.env.mysql.user,
            password: env_1.env.mysql.password,
            database: env_1.env.mysql.database,
            waitForConnections: true,
            connectionLimit: env_1.env.mysql.connectionLimit,
            queueLimit: 0,
            namedPlaceholders: true,
            decimalNumbers: true,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        });
    }
    /**
     * Returns the underlying MySQL pool.
     */
    getPool() {
        return this.pool;
    }
    /**
     * Verify database connectivity.
     */
    async connect() {
        const connection = await this.pool.getConnection();
        try {
            await connection.ping();
            console.log("✅ MySQL connected");
        }
        finally {
            connection.release();
        }
    }
    /**
     * Gracefully close pool.
     */
    async disconnect() {
        await this.pool.end();
    }
    /**
     * Helper for transactions.
     */
    async transaction(callback) {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
}
const database = new Database();
exports.database = database;
exports.pool = database.getPool();
//# sourceMappingURL=pool.js.map