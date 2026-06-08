import fetch from 'node:http';
// Using native fetch in Node 18+

const BASE_URL = "https://9yhgh43d.us-east.insforge.app";
const API_KEY = "ik_125436cd834378c3d5b427716b96933f";

const sql = `
-- Fix recursive chat_participants policy
DROP POLICY IF EXISTS "Users can view participants of their chats." ON public.chat_participants;
CREATE POLICY "Users can view participants of their chats." ON public.chat_participants
  FOR SELECT USING (
    profile_id = auth.uid()
    OR
    chat_id IN (
      SELECT cp2.chat_id FROM public.chat_participants cp2
      WHERE cp2.profile_id = auth.uid()
    )
  );

-- Fix messages policy (ensure it works)
DROP POLICY IF EXISTS "Users can view messages in their chats." ON public.messages;
CREATE POLICY "Users can view messages in their chats." ON public.messages
  FOR SELECT USING (
    chat_id IN (
      SELECT cp.chat_id FROM public.chat_participants cp
      WHERE cp.profile_id = auth.uid()
    )
  );
`;

const res = await fetch(`${BASE_URL}/rest/v1/rpc/execute_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': API_KEY,
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({ query: sql })
});

const text = await res.text();
console.log('Status:', res.status);
console.log('Response:', text);
