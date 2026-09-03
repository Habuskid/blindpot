import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS "ActivityLog" (
      "id" TEXT PRIMARY KEY,
      "userAddress" TEXT NOT NULL,
      "poolId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "amount" DOUBLE PRECISION,
      "drawId" INTEGER,
      "txHash" TEXT NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  try {
    await sql`CREATE INDEX IF NOT EXISTS "ActivityLog_userAddress_idx" ON "ActivityLog"("userAddress");`;
  } catch (e) {}

  await sql`
    CREATE TABLE IF NOT EXISTS "BugLog" (
      "id" TEXT PRIMARY KEY,
      "message" TEXT NOT NULL,
      "details" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  const bugs = await sql`SELECT * FROM "BugLog" ORDER BY "createdAt" DESC LIMIT 10`;
  console.log('Bugs:', JSON.stringify(bugs, null, 2));
}

run().catch(console.error);
