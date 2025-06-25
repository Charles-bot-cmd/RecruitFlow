import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './shared/schema';
import 'dotenv/config';

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error(
    'DATABASE_URL environment variable is not set. Please check your .env file or command line.'
  );
  process.exit(1);
}

const migrationClient = postgres(DATABASE_URL, { max: 1 });

const db = drizzle(migrationClient, { schema });

async function main() {
  try {
    console.log('Starting migration...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await migrationClient.end();
  }
}

main(); 