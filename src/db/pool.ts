import {
    createPool,
    Pool,
    PoolConnection
} from "mysql2/promise";

import { env } from "../config/env";

class Database {
    private readonly pool: Pool;
    constructor() {
        this.pool = createPool({
            host: env.mysql.host,
            port: env.mysql.port,
            user: env.mysql.user,
            password: env.mysql.password,
            database: env.mysql.database,
            waitForConnections: true,
            connectionLimit: env.mysql.connectionLimit,
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
    public getPool(): Pool {
        return this.pool;
    }

    /**
     * Verify database connectivity.
     */
    public async connect(): Promise<void> {
        const connection = await this.pool.getConnection();
        try {
            await connection.ping();
            console.log("✅ MySQL connected");
        } finally {
            connection.release();
        }
    }

    /**
     * Gracefully close pool.
     */
    public async disconnect(): Promise<void> {
        await this.pool.end();
    }

    /**
     * Helper for transactions.
     */
    public async transaction<T>(callback: (connection: PoolConnection) => Promise<T>): Promise<T> {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

const database = new Database();
export const pool = database.getPool();
export { database };