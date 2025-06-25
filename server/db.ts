// If you see linter errors for drizzle-orm or pg, run:
// npm install drizzle-orm pg
// npm install --save-dev @types/node
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../shared/schema';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema }); 