import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

// Requires DATABASE_URL to be set in environment
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log('Seeding staff users...');
  
  const staff = [
    { name: 'System Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' },
    { name: 'System Mod', email: 'moderator@test.com', password: 'Moderator@123', role: 'moderator' }
  ];

  for (const u of staff) {
    const hash = await bcrypt.hash(u.password, 10);
    try {
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [u.name, u.email, hash, u.role]
      );
      console.log(`✅ Seeded ${u.role}: ${u.email}`);
    } catch (err: any) {
      console.error(`❌ Error seeding ${u.email}:`, err.message);
    }
  }

  await pool.end();
}

main().catch(console.error);
