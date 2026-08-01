import { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/pool';

export abstract class BaseRepository {
    protected readonly db = pool;

  constructor(database: Pool = pool) {
    this.db = database;
  }

  /**
   * Execute a SELECT query.
   */
  protected async query<R extends RowDataPacket[]>(
    sql: string,
    params: any[] = []
  ): Promise<R> {
    const [rows] = await this.db.query<R>(sql, params);
    return rows;
  }

  /**
   * Execute INSERT / UPDATE / DELETE.
   */
  protected async execute(
    sql: string,
    params: any[] = []
  ): Promise<ResultSetHeader> {
    const [result] = await this.db.execute<ResultSetHeader>(sql, params);
    return result;
  }

  /**
   * Return a single record or null.
   */
  protected async first<R extends RowDataPacket>(
    sql: string,
    params: any[] = []
  ): Promise<R | null> {
    const rows = await this.query<R[]>(sql, params);

    if (rows.length === 0) {
      return null;
    }

    return rows[0];
  }

  /**
   * Execute work inside a database transaction.
   */
  protected async transaction<R>(
    callback: (connection: PoolConnection) => Promise<R>
  ): Promise<R> {
    const connection = await this.db.getConnection();

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