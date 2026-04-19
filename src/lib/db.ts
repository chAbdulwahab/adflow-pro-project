import { Pool } from 'pg';

// Create a connection pool (reuses connections for performance)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

// Helper: run SQL queries + expose pool for transactions
export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool, // expose for status-machine transactions
};

export default pool;