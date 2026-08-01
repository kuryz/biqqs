"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const pool_1 = require("../db/pool");
class BaseRepository {
    db = pool_1.pool;
    constructor(database = pool_1.pool) {
        this.db = database;
    }
    /**
     * Execute a SELECT query.
     */
    async query(sql, params = []) {
        const [rows] = await this.db.query(sql, params);
        return rows;
    }
    /**
     * Execute INSERT / UPDATE / DELETE.
     */
    async execute(sql, params = []) {
        const [result] = await this.db.execute(sql, params);
        return result;
    }
    /**
     * Return a single record or null.
     */
    async first(sql, params = []) {
        const rows = await this.query(sql, params);
        if (rows.length === 0) {
            return null;
        }
        return rows[0];
    }
    /**
     * Execute work inside a database transaction.
     */
    async transaction(callback) {
        const connection = await this.db.getConnection();
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
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map