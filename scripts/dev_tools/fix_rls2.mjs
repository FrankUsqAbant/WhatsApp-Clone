const BASE_URL = 'https://9yhgh43d.us-east.insforge.app';
const API_KEY = 'ik_125436cd834378c3d5b427716b96933f';

// Try to execute SQL via the REST API rpc endpoint
async function runSQL(sql) {
  const res = await fetch(`${BASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ sql })
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

// Fix the infinite recursion in chat_participants RLS policy
const fixSQL = `
DROP POLICY IF EXISTS "Users can view participants of their chats." ON public.chat_participants;
CREATE POLICY "Users can view participants of their chats." ON public.chat_participants
  FOR SELECT USING (profile_id = auth.uid());
`;

const result = await runSQL(fixSQL);
console.log('Status:', result.status);
console.log('Body:', result.body.substring(0, 500));

// Also try the query endpoint
const res2 = await fetch(`${BASE_URL}/rest/v1/chat_participants?select=chat_id,profile_id&limit=1`, {
  headers: { 'apikey': API_KEY, 'Authorization': `Bearer ${API_KEY}` }
});
console.log('\nDirect query status:', res2.status);
const body2 = await res2.text();
console.log('Direct query:', body2.substring(0, 300));
