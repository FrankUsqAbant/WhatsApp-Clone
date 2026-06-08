import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

const insforge = createClient({ baseUrl: insforgeUrl, anonKey: insforgeAnonKey });

async function seed() {
  const usersToSeed = [
    { email: 'maria@demo.com', password: 'password123', name: 'María (Trabajo)' },
    { email: 'carlos@demo.com', password: 'password123', name: 'Carlos Dev' },
    { email: 'ana@demo.com', password: 'password123', name: 'Ana' },
    // A test user simulating the one the user wants
    { email: 'ethan21abanto@gmail.com', password: 'Password123!', name: 'Ethan Abanto' }
  ];

  for (const u of usersToSeed) {
    const { data: authData, error: authErr } = await insforge.auth.signUp({
      email: u.email,
      password: u.password,
      name: u.name
    });
    
    if (authErr && !authErr.message.includes('already exists') && !authErr.message.includes('already registered')) {
      console.log('Error creating', u.email, authErr);
    } else {
      console.log('Created auth for', u.email);
    }
  }

  // Now, try to sign in each user and upsert their profile (since RLS allows users to insert their OWN profile)
  for (const u of usersToSeed) {
    const { data: userLogin, error: loginErr } = await insforge.auth.signInWithPassword({ email: u.email, password: u.password });
    if (userLogin?.user) {
      console.log('Signed in', u.email, 'upserting profile...');
      const { error: profileErr } = await insforge.database.from('profiles').upsert({
        id: userLogin.user.id,
        email: u.email,
        full_name: u.name,
        about: 'Disponible para hablar'
      });
      if (profileErr) console.error('Error upserting profile for', u.email, profileErr);
      await insforge.auth.signOut();
    } else {
      console.log('Could not sign in', u.email, loginErr);
    }
  }

  console.log('Seed completed!');
}
seed();
