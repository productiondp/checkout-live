-- CHECKOUT PRODUCTION DATABASE SCHEMA V.7
-- Optimized for Supabase Auth, Realtime, and AI-driven Matchmaking

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For Neural Match Engine

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE profile_role AS ENUM ('STUDENT', 'BUSINESS', 'PROFESSIONAL', 'ADVISOR');
    CREATE TYPE post_type AS ENUM ('LEAD', 'HIRING', 'PARTNER', 'MEETUP', 'UPDATE');
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role profile_role DEFAULT 'PROFESSIONAL',
  avatar_url TEXT,
  city TEXT DEFAULT 'Trivandrum',
  location TEXT,
  bio TEXT,
  match_score INTEGER DEFAULT 80,
  is_premium BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding vector(1536), -- For AI interest matching
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. POSTS (Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type post_type NOT NULL DEFAULT 'UPDATE',
  title TEXT NOT NULL,
  content TEXT,
  location TEXT DEFAULT 'Trivandrum',
  match_score INTEGER DEFAULT 0,
  
  -- Structured Data
  budget TEXT,
  due_date DATE,
  skills_required TEXT[], -- Array of skills
  work_type TEXT,
  duration TEXT,
  offer TEXT,
  need TEXT,
  timeline TEXT,
  
  -- Session Data
  max_slots INTEGER DEFAULT 1,
  payment_type TEXT DEFAULT 'Free',
  domain TEXT,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CHAT ROOMS
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ROOM PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.participants (
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- 6. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. BOOKINGS (Expert Sessions)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID REFERENCES public.profiles(id),
  client_id UUID REFERENCES public.profiles(id),
  post_id UUID REFERENCES public.posts(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status booking_status DEFAULT 'PENDING',
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. COMMUNITIES
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  room_id UUID,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. COMMUNITY MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.memberships (
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'MEMBER',
  PRIMARY KEY (community_id, user_id)
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. RATINGS & TRUST
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL, -- Link to session
  score INTEGER CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. AUTOMATIC PROFILE CREATION (Trigger for Auth)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role public.profile_role;
  v_name text;
BEGIN
  -- 1. Extract and sanitize metadata
  v_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Business Partner');
  
  -- 2. Defensive Role Parsing
  BEGIN
    v_role := UPPER(TRIM(new.raw_user_meta_data->>'role'))::public.profile_role;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'PROFESSIONAL'::public.profile_role;
  END;

  -- 3. Atomic Insertion with Full Metadata
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    avatar_url,
    city, 
    location
  )
  VALUES (
    new.id,
    v_name,
    COALESCE(v_role, 'PROFESSIONAL'::public.profile_role),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'city', 'Trivandrum'),
    COALESCE(new.raw_user_meta_data->>'location', 'Trivandrum')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    avatar_url = EXCLUDED.avatar_url,
    city = EXCLUDED.city;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12.1 AUTOMATIC MESSAGE NOTIFICATIONS
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Find the recipient (the other participant in the room)
  SELECT user_id INTO recipient_id 
  FROM public.participants 
  WHERE room_id = new.room_id AND user_id != new.sender_id
  LIMIT 1;

  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      recipient_id,
      'New Message',
      (SELECT full_name FROM public.profiles WHERE id = new.sender_id) || ' sent you a message.',
      'MESSAGE',
      '/chat?room=' || new.room_id
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- 13. ENABLE REALTIME
-- This allows clients to subscribe to changes in these tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 14. ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON posts;
CREATE POLICY "Posts are viewable by everyone" ON posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see messages in rooms they are in" ON messages;
CREATE POLICY "Users can see messages in rooms they are in" ON messages FOR SELECT
USING (EXISTS (SELECT 1 FROM participants WHERE room_id = messages.room_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can send messages to rooms they are in" ON messages;
CREATE POLICY "Users can send messages to rooms they are in" ON messages FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM participants WHERE room_id = messages.room_id AND user_id = auth.uid()));

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see rooms they are in" ON chat_rooms;
CREATE POLICY "Users can see rooms they are in" ON chat_rooms FOR SELECT
USING (EXISTS (SELECT 1 FROM participants WHERE room_id = chat_rooms.id AND user_id = auth.uid()));

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see own bookings" ON bookings;
CREATE POLICY "Users can see own bookings" ON bookings FOR SELECT
USING (auth.uid() = advisor_id OR auth.uid() = client_id);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;

-- 16. SIMULATED EMBEDDING GENERATOR (for pgvector ranking)
-- This function maps keywords to unique positions in the 1536-dim vector space
CREATE OR REPLACE FUNCTION public.generate_simulated_embedding(content text)
RETURNS vector(1536) AS $$
DECLARE
  vec float8[];
  words text[];
  word text;
  idx int;
BEGIN
  -- Initialize a zero vector
  vec := ARRAY(SELECT 0.0::float8 FROM generate_series(1, 1536));
  
  -- Simple Keyword Hash Mapping
  words := string_to_array(lower(content), ' ');
  
  FOREACH word IN ARRAY words LOOP
    -- Simple deterministic hash (1 to 1536)
    idx := (abs(hashtext(word)) % 1536) + 1;
    vec[idx] := vec[idx] + 1.0;
  END LOOP;
  
  -- Return as vector type
  RETURN vec::vector(1536);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 16.1 AUTOMATIC EMBEDDING SYNC
CREATE OR REPLACE FUNCTION public.handle_embedding_sync()
RETURNS trigger AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.embedding := public.generate_simulated_embedding(COALESCE(NEW.full_name, '') || ' ' || COALESCE(NEW.bio, '') || ' ' || COALESCE(NEW.role::text, ''));
  ELSIF TG_TABLE_NAME = 'posts' THEN
    NEW.embedding := public.generate_simulated_embedding(COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_update_embedding ON public.profiles;
CREATE TRIGGER on_profile_update_embedding
  BEFORE INSERT OR UPDATE OF full_name, bio, role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_embedding_sync();

DROP TRIGGER IF EXISTS on_post_update_embedding ON public.posts;
CREATE TRIGGER on_post_update_embedding
  BEFORE INSERT OR UPDATE OF title, content ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_embedding_sync();

-- Search Posts by User Embedding
CREATE OR REPLACE FUNCTION match_posts (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_type text DEFAULT 'ALL'
)
RETURNS TABLE (
  id uuid,
  author_id uuid,
  title text,
  content text,
  type post_type,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.author_id,
    p.title,
    p.content,
    p.type,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM posts p
  WHERE (filter_type = 'ALL' OR p.type::text = filter_type)
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 17. SYNDICATE CHAT SYNCHRONIZATION
-- Automatically create a room for each community on foundation
CREATE OR REPLACE FUNCTION public.handle_community_foundation()
RETURNS trigger AS $$
DECLARE
  new_room_id UUID;
BEGIN
  -- 1. Create a group room
  INSERT INTO public.chat_rooms (title, is_group)
  VALUES (NEW.name || ' Inner Circle', true)
  RETURNING id INTO new_room_id;

  -- 2. Link the room to the community
  NEW.room_id := new_room_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_community_foundation ON public.communities;
CREATE TRIGGER on_community_foundation
  BEFORE INSERT ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.handle_community_foundation();
CREATE OR REPLACE FUNCTION match_users (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  role profile_role,
  bio text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.role,
    p.bio,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM profiles p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 18. AUTONOMOUS TRUST RECALIBRATION
-- Adjusts Profile Match Score based on tactical ratings
CREATE OR REPLACE FUNCTION public.recalibrate_trust_score()
RETURNS trigger AS $$
DECLARE
  avg_score FLOAT;
  new_trust_score INTEGER;
BEGIN
  -- 1. Calculate Average from all ratings for the receiver
  SELECT AVG(score) INTO avg_score 
  FROM public.ratings 
  WHERE receiver_id = NEW.receiver_id;

  -- 2. Map 1-5 scale to 1-100 Match Score
  -- (Base 50 + (avg * 10))
  new_trust_score := ROUND(50 + (avg_score * 10));

  -- 3. Update Profile
  UPDATE public.profiles 
  SET match_score = LEAST(100, new_trust_score)
  WHERE id = NEW.receiver_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_submitted ON public.ratings;
CREATE TRIGGER on_rating_submitted
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.recalibrate_trust_score();
