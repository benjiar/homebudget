import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@homebudget/db';

@Injectable()
export class DatabaseService {
  private db;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(pool, { schema });
  }

  get query() {
    return this.db.query;
  }

  get insert() {
    return this.db.insert;
  }

  get update() {
    return this.db.update;
  }

  get delete() {
    return this.db.delete;
  }
} 