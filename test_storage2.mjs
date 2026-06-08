import { createClient } from '@insforge/sdk';

const BASE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const client = createClient({ baseUrl: BASE_URL, anonKey: ANON_KEY });

// List buckets
console.log('=== Listing buckets ===');
const { data: buckets, error: bErr } = await client.storage.listBuckets();
console.log('Error:', bErr?.message);
console.log('Buckets:', buckets);

// Try to get bucket info
const { data: b1 } = await client.storage.getBucket('chat_attachments');
console.log('chat_attachments bucket:', b1);

const { data: b2 } = await client.storage.getBucket('avatars');
console.log('avatars bucket:', b2);
