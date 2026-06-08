import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

async function testUpload() {
  const db = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });
  
  // Create a new user to test
  const testEmail = `test_${Date.now()}@example.com`;
  const { data: signUpData, error: signUpError } = await db.auth.signUp({
    email: testEmail,
    password: 'password123',
    options: {
      data: {
        full_name: 'Test User'
      }
    }
  });

  if (signUpError) {
    console.error("SignUp Error:", signUpError);
    return;
  }

  const authenticatedDb = createClient({
    baseUrl: BASE_URL,
    anonKey: ANON_KEY,
    accessToken: signUpData.session.access_token
  });

  // Try to upload
  const fileContent = "This is a test image content";
  const file = new File([fileContent], "test.png", { type: "image/png" });

  const filePath = `${signUpData.user.id}/test_${Date.now()}.png`;

  console.log("Uploading to status_media...");
  const { data: uploadData, error: uploadError } = await authenticatedDb.storage
    .from('status_media')
    .upload(filePath, file);

  if (uploadError) {
    console.error("Upload Error:", uploadError);
    return;
  }

  console.log("Upload Success:", uploadData);

  const publicUrl = authenticatedDb.storage
    .from('status_media')
    .getPublicUrl(filePath);

  console.log("Public URL:", publicUrl);

  console.log("Inserting to statuses table...");
  const { data: insertData, error: insertError } = await authenticatedDb.database
    .from('statuses')
    .insert({
      profile_id: signUpData.user.id,
      media_url: publicUrl
    });

  if (insertError) {
    console.error("Insert Error:", insertError);
    return;
  }

  console.log("Insert Success!");
}

testUpload();
