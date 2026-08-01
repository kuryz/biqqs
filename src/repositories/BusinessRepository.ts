import { RowDataPacket } from 'mysql2/promise';

import { BaseRepository } from './BaseRepository';
import { Business } from '../models/Business';
import { Channel } from '../types';

interface BusinessRow extends RowDataPacket {
  id: number;
  chat_id: string;
  channel: Channel;
  business_name: string | null;
  plan: string;
  created_at: Date;
}

export class BusinessRepository extends BaseRepository {

  public async findByChatId(
    chatId: string,
    channel: Channel
  ): Promise<Business | null> {

    const row = await this.first<BusinessRow>(
      `
      SELECT *
      FROM businesses
      WHERE chat_id = ?
      AND channel = ?
      LIMIT 1
      `,
      [chatId, channel]
    );

    if (!row) {
      return null;
    }

    return this.map(row);
  }

  public async create(
    chatId: string,
    channel: Channel
  ): Promise<Business> {

    const result = await this.execute(
      `
      INSERT INTO businesses
      (
          chat_id,
          channel,
          plan
      )
      VALUES
      (
          ?,
          ?,
          'free'
      )
      `,
      [chatId, channel]
    );

    return new Business(
      result.insertId,
      chatId,
      channel,
      null,
      'free',
      new Date()
    );
  }

  public async updatePlan(
    businessId: number,
    plan: string
  ): Promise<void> {

    await this.execute(
      `
      UPDATE businesses
      SET plan = ?
      WHERE id = ?
      `,
      [
        plan,
        businessId
      ]
    );
  }

  public async findOrCreate(
    chatId: string,
    channel: Channel
  ): Promise<Business> {

    let business = await this.findByChatId(chatId, channel);

    if (business) {
      return business;
    }

    return this.create(chatId, channel);
  }

  protected map(row: BusinessRow): Business {

    return new Business(
      row.id,
      row.chat_id,
      row.channel,
      row.business_name,
      row.plan,
      row.created_at
    );

  }
}
