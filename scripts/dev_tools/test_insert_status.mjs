import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

async function testInsert() {
  const authDb = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
  });

  // Try authenticating as Ethan just to get a token
  // Oh wait, OAuth doesn't have a password. 
  // How can I test this? I can test with service role key if I have it, or just query the error directly from the browser?
}
testInsert();
