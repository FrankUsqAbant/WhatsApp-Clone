import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

async function testInsert() {
  // First, we need a valid session to simulate the user.
  // We can just login with Ethan's email and password!
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: 'ethan21abanto@gmail.com',
    password: 'Password123!'
  });
  
  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  console.log("Logged in:", authData.user.id);
  
  const { data: chatData, error: chatError } = await insforge.database.from('chats').insert({ is_group: false }).select().single();
  
  console.log("Chat Data:", chatData);
  console.log("Chat Error:", chatError);
}

testInsert();
