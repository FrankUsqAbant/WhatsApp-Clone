-- 1. Create a trigger to auto-populate profiles on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Backfill profiles for existing users (like ethan21abanto@gmail.com)
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
  id, 
  email, 
  split_part(email, '@', 1),
  NULL
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Insert mock users into auth.users (so they can be referenced in chats)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at)
VALUES 
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria@demo.com', 'fakepassword', now()),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos@demo.com', 'fakepassword', now()),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@demo.com', 'fakepassword', now())
ON CONFLICT (id) DO NOTHING;

-- 4. Insert mock profiles
INSERT INTO public.profiles (id, email, full_name, about)
VALUES 
('11111111-1111-1111-1111-111111111111', 'maria@demo.com', 'María (Trabajo)', 'Disponible'),
('22222222-2222-2222-2222-222222222222', 'carlos@demo.com', 'Carlos Dev', 'En el gimnasio'),
('33333333-3333-3333-3333-333333333333', 'ana@demo.com', 'Ana', 'Ocupado')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, about = EXCLUDED.about;
