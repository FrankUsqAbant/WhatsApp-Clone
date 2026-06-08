import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

async function fix() {
  const client = new Client({
    connectionString: "postgresql://postgres:eb13841e162b887c95cb64de641f61c1@9yhgh43d.us-east.database.insforge.app:5432/insforge?sslmode=require"
  });

  await client.connect();

  const sql = fs.readFileSync('fix_trigger.sql', 'utf8');
  await client.query(sql);

  const seed = fs.readFileSync('seed_contacts.sql', 'utf8');
  await client.query(seed);

  console.log("Trigger fixed and profiles inserted!");
  await client.end();
}

fix().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
