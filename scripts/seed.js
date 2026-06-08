import { createClient } from '@insforge/sdk';

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

if (!insforgeUrl || !insforgeAnonKey) {
  console.error("Faltan las variables de entorno de InsForge.");
  process.exit(1);
}

const insforge = createClient(insforgeUrl, insforgeAnonKey);

const DUMMY_USERS = [
  { email: 'maria@test.com', password: 'Password123!', full_name: 'María (Trabajo)', avatar_url: 'https://i.pravatar.cc/150?u=1' },
  { email: 'carlos@test.com', password: 'Password123!', full_name: 'Carlos Dev', avatar_url: 'https://i.pravatar.cc/150?u=2' },
  { email: 'ana@test.com', password: 'Password123!', full_name: 'Ana', avatar_url: 'https://i.pravatar.cc/150?u=3' },
];

async function seed() {
  console.log('Iniciando el seed de contactos...');
  const createdProfiles = [];

  for (const user of DUMMY_USERS) {
    console.log(`Creando usuario ${user.email}...`);
    const { data, error } = await insforge.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        }
      }
    });

    if (error) {
      console.error(`Error creando ${user.email}:`, error.message);
    } else if (data?.user) {
      console.log(`Usuario creado exitosamente: ${user.email}`);
      createdProfiles.push(data.user);
    }
  }

  console.log('Seed de usuarios terminado. (La creación de los perfiles está automatizada por el trigger SQL).');
  console.log('Puedes iniciar sesión con cualquiera de estos correos y la contraseña "Password123!".');
}

seed().catch(console.error);
