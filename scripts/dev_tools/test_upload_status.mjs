import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

async function testUpload() {
  const db = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  const { data: sessionData, error: sessionError } = await db.auth.signInWithPassword({
    email: 'ethan21abanto@gmail.com',
    password: 'Password123!'
  });
  
  if (sessionError) {
    console.error("Login failed:", sessionError);
    return;
  }

  const authenticatedDb = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
    accessToken: sessionData.session.access_token
  });

  const blob = new Blob(["test image"], { type: "image/png" });
  const { data, error } = await authenticatedDb.storage
    .from('status_media')
    .upload('test_user/test.png', blob);
    
  console.log("Upload Error:", error);
  console.log("Upload Data:", data);
}
testUpload().catch(console.error);
