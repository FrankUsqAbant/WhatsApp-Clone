import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;
// Using anon key or service role? We can just use anon key and update profiles where auth.uid() = id? No, anon key can't update other users.
// Wait, Ethan logged in with Google, but we want to update María, Carlos, Ana...
// The policy says: "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
// So we can't update them using the SDK with Anon Key!
// BUT we can use the InsForge CLI to run a raw SQL query!
