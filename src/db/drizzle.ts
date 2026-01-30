import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';


const globalForPool = globalThis as unknown as { pool: Pool | undefined };

const isProduction = process.env.NODE_ENV === 'production';

const pool = globalForPool.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase') || process.env.DATABASE_URL?.includes('neon')
    ? { rejectUnauthorized: false }
    : false,
  // Connection pool settings
  max: isProduction ? 5 : 10, // Lower in production (serverless)
  min: 0, // Don't maintain idle connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000, // Fail fast if can't connect in 5s
  maxUses: 7500, // Close connection after 7500 queries (prevents memory leaks)
  allowExitOnIdle: true, // Allow process to exit if all connections are idle
});

// Reuse pool in development to avoid creating too many during hot reloads
if (!isProduction) globalForPool.pool = pool;

export const db = drizzle(pool, { schema });

// Export pool for health checks or manual cleanup if needed
export { pool };
