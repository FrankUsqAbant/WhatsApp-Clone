import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

async function checkProfiles() {
  const { data, error } = await insforge.database.from('profiles').select('*');
  console.log('Profiles:', data);
  console.log('Error:', error);
}

checkProfiles();
