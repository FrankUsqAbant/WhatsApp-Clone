import { createClient } from '@insforge/sdk';

const BASE_URL = "https://9yhgh43d.us-east.insforge.app";
const ANON_KEY = "ik_125436cd834378c3d5b427716b96933f";

const db = createClient(BASE_URL, ANON_KEY);

// Test 1: Login as leerparapensar
console.log('=== Logging in as leerparapensar ===');
const { data: { session: s1 }, error: loginErr1 } = await db.auth.signInWithPassword({
  email: 'leerparapensar@gmail.com',
  password: 'test1234'
});

if (loginErr1) {
  console.log('Login failed:', loginErr1.message);
  console.log('Try different password');
  process.exit(1);
}

console.log('Logged in as:', s1?.user?.email, '| ID:', s1?.user?.id);

// Test 2: Check which chats user is in
const { data: participations, error: pErr } = await db.database
  .from('chat_participants')
  .select('chat_id')
  .eq('profile_id', s1.user.id);

console.log('Participations error:', pErr);
console.log('Participations:', participations);

if (participations && participations.length > 0) {
  const chatId = participations[0].chat_id;
  console.log('\n=== Testing messages for chat:', chatId, '===');
  
  const { data: msgs, error: mErr } = await db.database
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  
  console.log('Messages error:', mErr);
  console.log('Messages count:', msgs?.length);
  console.log('Messages:', msgs);
}
