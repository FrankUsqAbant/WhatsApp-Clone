-- Keep only the OLDEST chat between each pair of users (delete duplicates)
WITH ranked_chats AS (
  SELECT
    cp1.chat_id,
    cp1.profile_id AS user1,
    cp2.profile_id AS user2,
    c.created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LEAST(cp1.profile_id::text, cp2.profile_id::text),
                   GREATEST(cp1.profile_id::text, cp2.profile_id::text)
      ORDER BY c.created_at ASC
    ) AS rn
  FROM public.chat_participants cp1
  JOIN public.chat_participants cp2
    ON cp1.chat_id = cp2.chat_id AND cp1.profile_id < cp2.profile_id
  JOIN public.chats c ON c.id = cp1.chat_id
  WHERE c.is_group = false
)
DELETE FROM public.chats
WHERE id IN (
  SELECT chat_id FROM ranked_chats WHERE rn > 1
);
