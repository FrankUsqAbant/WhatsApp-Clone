import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

async function test() {
  const { data, error } = await insforge.storage.from('chat_attachments').upload('test.txt', 'hello', { contentType: 'text/plain' });
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
