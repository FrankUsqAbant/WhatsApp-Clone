import fs from 'fs';
const BASE_URL = 'https://9yhgh43d.us-east.insforge.app';
const API_KEY = 'ik_125436cd834378c3d5b427716b96933f';

async function runSQL() {
  const sql = fs.readFileSync('create_statuses.sql', 'utf8');
  console.log("Running SQL...");
  const res = await fetch(`${BASE_URL}/api/database/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ query: sql })
  });
  console.log(res.status, res.statusText);
  if (!res.ok) console.log(await res.text());
}
runSQL().catch(console.error);
