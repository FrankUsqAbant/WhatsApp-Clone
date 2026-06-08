import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

async function testInsertMsg() {
  const { data: authData, error: authError } = await insforge.auth.signInWithPassword({
    email: 'ethan21abanto@gmail.com',
    password: 'Password123!'
  });
  if (authError) {
    console.error("Auth Error:", authError);
  }
  
  const userId = authData?.user?.id;
  
  // get a chat we are part of
  const { data: participants } = await insforge.database.from('chat_participants').select('chat_id').eq('profile_id', userId).limit(1);
  if (!participants || participants.length === 0) {
    console.error("No chats found");
    return;
  }
  const chatId = participants[0].chat_id;
  console.log("Found chat", chatId);
  
  // try inserting a message
  const { data: msgData, error: msgError } = await insforge.database.from('messages').insert({
    chat_id: chatId,
    sender_id: userId,
    content: "Hello Test"
  });
  
  console.log("Msg Insert Data:", msgData);
  console.log("Msg Insert Error:", msgError);
}

testInsertMsg();
