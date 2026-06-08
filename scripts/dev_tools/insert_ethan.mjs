import pkg from 'pg';
const { Client } = pkg;

async function fix() {
  const client = new Client({
    connectionString: "postgresql://postgres:eb13841e162b887c95cb64de641f61c1@9yhgh43d.us-east.database.insforge.app:5432/insforge?sslmode=require"
  });

  await client.connect();

  const query = `
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    SELECT id, email, 'Ethan Abanto', NULL
    FROM auth.users
    WHERE email = 'ethan21abanto@gmail.com'
    ON CONFLICT (id) DO UPDATE SET full_name = 'Ethan Abanto';
    
    -- Let's also set the full names for the mocked users, just in case
    UPDATE public.profiles SET full_name = 'María (Trabajo)' WHERE email = 'maria@demo.com';
    UPDATE public.profiles SET full_name = 'Carlos Dev' WHERE email = 'carlos@demo.com';
    UPDATE public.profiles SET full_name = 'Ana' WHERE email = 'ana@demo.com';
  `;

  await client.query(query);

  const { rows } = await client.query(`SELECT email, full_name FROM public.profiles`);
  console.log("Current Profiles in DB:", rows);

  await client.end();
}

fix().catch(err => {
  console.error("Failed:", err);
  process.exit(1);
});
