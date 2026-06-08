-- Create a SECURITY DEFINER function that bypasses RLS
-- This avoids infinite recursion while still being safe
CREATE OR REPLACE FUNCTION public.get_my_chat_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT chat_id FROM public.chat_participants WHERE profile_id = uid;
$$;

-- Now fix chat_participants SELECT policy to use this function (no recursion)
DROP POLICY IF EXISTS "Users can view participants of their chats." ON public.chat_participants;
CREATE POLICY "Users can view participants of their chats." ON public.chat_participants
  FOR SELECT USING (
    chat_id IN (SELECT public.get_my_chat_ids(auth.uid()))
  );

-- Fix messages policy to use same function
DROP POLICY IF EXISTS "Users can view messages in their chats." ON public.messages;
CREATE POLICY "Users can view messages in their chats." ON public.messages
  FOR SELECT USING (
    chat_id IN (SELECT public.get_my_chat_ids(auth.uid()))
  );

-- Fix chats policy too
DROP POLICY IF EXISTS "Users can view chats they are part of." ON public.chats;
CREATE POLICY "Users can view chats they are part of." ON public.chats
  FOR SELECT USING (
    id IN (SELECT public.get_my_chat_ids(auth.uid()))
  );
