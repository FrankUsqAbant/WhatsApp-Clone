-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES (Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  about TEXT DEFAULT 'Available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- CONTACTS (Relationships between users)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, contact_id)
);

-- CHATS (Conversations)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  group_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- CHAT PARTICIPANTS (Who is in which chat)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (chat_id, profile_id)
);

-- MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, read
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for contacts
CREATE POLICY "Users can view their own contacts." ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts." ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for chats
CREATE POLICY "Users can view chats they are part of." ON public.chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = id AND profile_id = auth.uid())
);
CREATE POLICY "Users can create chats." ON public.chats FOR INSERT WITH CHECK (true);

-- Policies for chat participants
CREATE POLICY "Users can view participants of their chats." ON public.chat_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_participants cp WHERE cp.chat_id = chat_id AND cp.profile_id = auth.uid())
);
CREATE POLICY "Users can add participants to chats." ON public.chat_participants FOR INSERT WITH CHECK (true);

-- Policies for messages
CREATE POLICY "Users can view messages in their chats." ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = messages.chat_id AND profile_id = auth.uid())
);
CREATE POLICY "Users can insert messages in their chats." ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.chat_participants WHERE chat_id = messages.chat_id AND profile_id = auth.uid())
);

-- Realtime Configuration
DROP PUBLICATION IF EXISTS insforge_realtime;
CREATE PUBLICATION insforge_realtime;

ALTER PUBLICATION insforge_realtime ADD TABLE public.messages;
ALTER PUBLICATION insforge_realtime ADD TABLE public.chats;
ALTER PUBLICATION insforge_realtime ADD TABLE public.chat_participants;
ALTER PUBLICATION insforge_realtime ADD TABLE public.contacts;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


