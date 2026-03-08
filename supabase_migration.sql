-- ============================================================
-- G-ONE CAMPAIGN — COMPLETE SUPABASE MIGRATION v2
-- Safe to re-run (uses IF NOT EXISTS / IF EXISTS everywhere)
-- ============================================================

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    session_token TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins full access" ON public.admins;
CREATE POLICY "Admins full access" ON public.admins FOR ALL USING (true);

-- Insert default admin (password: admin123 — CHANGE THIS IMMEDIATELY)
INSERT INTO public.admins (first_name, last_name, email, password_hash)
VALUES ('Campaign', 'Admin', 'admin@g-one.org', '$2a$10$8K1p/SPRK.0f0BKZQ1mRGuKEqPJZtJhGn1sIhPOLUBx0AYQ0RQWKW')
ON CONFLICT (email) DO NOTHING;

-- Insert Hamis Ahmed admin
INSERT INTO public.admins (first_name, last_name, email, phone, password_hash)
VALUES ('Hamis', 'Ahmed', 'hamisahmed10@gmail.com', '07067079704', '$2b$10$bwvAnBgAJJR0pE5xzJq25utzF3BXF5kNFxkxFBR7mdbj0FHSB/gey')
ON CONFLICT (email) DO NOTHING;

-- 2. SUPPORTERS TABLE (FIXED — matches registration form)
CREATE TABLE IF NOT EXISTS public.supporters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    whatsapp TEXT,
    email TEXT,
    gender TEXT,
    age_range TEXT,
    lga TEXT,
    ward TEXT,
    polling_unit_code TEXT,
    polling_unit_name TEXT,
    occupation TEXT,
    has_pvc TEXT,
    volunteer BOOLEAN DEFAULT false,
    hear_about TEXT,
    photo_url TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    is_duplicate_flag BOOLEAN DEFAULT false,
    referrer_id UUID REFERENCES public.supporters(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.supporters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert supporters" ON public.supporters;
DROP POLICY IF EXISTS "Public read supporters" ON public.supporters;
DROP POLICY IF EXISTS "Public update supporters" ON public.supporters;
DROP POLICY IF EXISTS "Public delete supporters" ON public.supporters;
CREATE POLICY "Public insert supporters" ON public.supporters FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read supporters" ON public.supporters FOR SELECT USING (true);
CREATE POLICY "Public update supporters" ON public.supporters FOR UPDATE USING (true);
CREATE POLICY "Public delete supporters" ON public.supporters FOR DELETE USING (true);

-- 3. POSTS TABLE
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    image_url TEXT,
    slug TEXT UNIQUE,
    category TEXT DEFAULT 'Campaign News',
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read posts" ON public.posts;
DROP POLICY IF EXISTS "Public insert posts" ON public.posts;
DROP POLICY IF EXISTS "Public update posts" ON public.posts;
DROP POLICY IF EXISTS "Public delete posts" ON public.posts;
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public insert posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Public delete posts" ON public.posts FOR DELETE USING (true);

-- 4. SITE SETTINGS TABLE (key-value store)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow update site_settings" ON public.site_settings;
CREATE POLICY "Public read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow insert site_settings" ON public.site_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update site_settings" ON public.site_settings FOR UPDATE USING (true);

-- Seed default settings
INSERT INTO public.site_settings (key, value) VALUES
    ('social_facebook', ''),
    ('social_twitter', ''),
    ('social_instagram', ''),
    ('social_whatsapp', ''),
    ('social_tiktok', ''),
    ('social_youtube', ''),
    ('contact_phone1', ''),
    ('contact_phone2', ''),
    ('contact_whatsapp', ''),
    ('contact_email', 'info@g-one.org'),
    ('contact_address', 'Campaign Headquarters, Ankpa, Kogi State, Nigeria'),
    ('seo_title', ''),
    ('seo_description', ''),
    ('seo_og_title', ''),
    ('seo_og_description', ''),
    ('seo_favicon', ''),
    ('seo_og_image', '')
ON CONFLICT (key) DO NOTHING;

-- 5. FLYER LOGS TABLE
CREATE TABLE IF NOT EXISTS public.flyer_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supporter_name TEXT,
    template TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.flyer_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read flyer_logs" ON public.flyer_logs;
DROP POLICY IF EXISTS "Public insert flyer_logs" ON public.flyer_logs;
CREATE POLICY "Public read flyer_logs" ON public.flyer_logs FOR SELECT USING (true);
CREATE POLICY "Public insert flyer_logs" ON public.flyer_logs FOR INSERT WITH CHECK (true);

-- 6. MESSAGES TABLE (contact form)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert messages" ON public.messages;
DROP POLICY IF EXISTS "Public read messages" ON public.messages;
DROP POLICY IF EXISTS "Public update messages" ON public.messages;
DROP POLICY IF EXISTS "Public delete messages" ON public.messages;
CREATE POLICY "Public insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public update messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Public delete messages" ON public.messages FOR DELETE USING (true);

-- 7. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    location TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Public insert events" ON public.events;
DROP POLICY IF EXISTS "Public update events" ON public.events;
DROP POLICY IF EXISTS "Public delete events" ON public.events;
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Public delete events" ON public.events FOR DELETE USING (true);

-- 8. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Events',
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public insert gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public update gallery" ON public.gallery;
DROP POLICY IF EXISTS "Public delete gallery" ON public.gallery;
CREATE POLICY "Public read gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Public insert gallery" ON public.gallery FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update gallery" ON public.gallery FOR UPDATE USING (true);
CREATE POLICY "Public delete gallery" ON public.gallery FOR DELETE USING (true);

-- ============================================================
-- NEW FEATURE TABLES
-- ============================================================

-- 9. ADMIN ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id),
    admin_name TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access admin_activity_log" ON public.admin_activity_log;
CREATE POLICY "Full access admin_activity_log" ON public.admin_activity_log FOR ALL USING (true);

-- 10. AGENTS (Ward Agents + PU Agents)
DROP TABLE IF EXISTS public.ward_agents CASCADE;
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'pu_agent', -- 'ward_agent' or 'pu_agent'
    lga TEXT NOT NULL,
    ward TEXT NOT NULL,
    polling_unit_code TEXT, -- only for pu_agent
    polling_unit_name TEXT, -- only for pu_agent
    is_active BOOLEAN DEFAULT true,
    session_token TEXT,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access agents" ON public.agents;
CREATE POLICY "Full access agents" ON public.agents FOR ALL USING (true);

-- 11. NOTIFICATION TEMPLATES
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    channel TEXT NOT NULL, -- 'sms', 'email', 'whatsapp'
    name TEXT NOT NULL,
    template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access notification_templates" ON public.notification_templates;
CREATE POLICY "Full access notification_templates" ON public.notification_templates FOR ALL USING (true);

-- Seed default notification templates
INSERT INTO public.notification_templates (channel, name, template) VALUES
    ('whatsapp', 'Welcome Supporter', 'Dear {{name}}, thank you for registering as a supporter of Prince Gowon Enenche (G-One) for House of Representatives! Together, we will build a stronger Ankpa Federal Constituency. 🟢 #VoteGOne2027'),
    ('sms', 'Welcome Supporter', 'Dear {{name}}, thank you for supporting G-One for House of Reps! Together we build a stronger constituency. #VoteGOne2027'),
    ('email', 'Welcome Supporter', 'Dear {{name}},\n\nThank you for registering as a supporter of Prince Gowon Enenche (G-One) for House of Representatives, Ankpa Federal Constituency 2027.\n\nYour support means the world to us. Together, we will transform our constituency through enterprise, education, infrastructure, and youth empowerment.\n\nWarm regards,\nG-One Campaign Team')
ON CONFLICT DO NOTHING;

-- 12. BROADCAST LOG
CREATE TABLE IF NOT EXISTS public.broadcast_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES public.admins(id),
    admin_name TEXT,
    channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'email'
    message TEXT NOT NULL,
    audience_filter TEXT, -- 'all', 'lga:Ankpa', 'ward:...'
    recipient_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.broadcast_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access broadcast_log" ON public.broadcast_log;
CREATE POLICY "Full access broadcast_log" ON public.broadcast_log FOR ALL USING (true);

-- 13. ELECTION DAY CHECKLIST
CREATE TABLE IF NOT EXISTS public.election_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lga TEXT NOT NULL,
    ward TEXT NOT NULL,
    polling_unit_code TEXT,
    polling_unit_name TEXT,
    agent_id UUID REFERENCES public.agents(id),
    agent_name TEXT,
    -- Checklist items
    materials_present BOOLEAN DEFAULT false,
    agents_present BOOLEAN DEFAULT false,
    pu_opened BOOLEAN DEFAULT false,
    voting_started BOOLEAN DEFAULT false,
    voting_ended BOOLEAN DEFAULT false,
    result_announced BOOLEAN DEFAULT false,
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.election_checklist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access election_checklist" ON public.election_checklist;
CREATE POLICY "Full access election_checklist" ON public.election_checklist FOR ALL USING (true);

-- 14. ELECTION RESULTS (PU-level scores)
CREATE TABLE IF NOT EXISTS public.election_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lga TEXT NOT NULL,
    ward TEXT NOT NULL,
    polling_unit_code TEXT NOT NULL,
    polling_unit_name TEXT,
    -- Party scores
    sdp_score INTEGER DEFAULT 0,
    apc_score INTEGER DEFAULT 0,
    pdp_score INTEGER DEFAULT 0,
    lp_score INTEGER DEFAULT 0,
    other_scores JSONB DEFAULT '{}', -- flexible for other parties
    total_votes INTEGER DEFAULT 0,
    accredited_voters INTEGER DEFAULT 0,
    registered_voters INTEGER DEFAULT 0,
    void_votes INTEGER DEFAULT 0,
    -- Metadata
    agent_id UUID REFERENCES public.agents(id),
    agent_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.election_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access election_results" ON public.election_results;
CREATE POLICY "Full access election_results" ON public.election_results FOR ALL USING (true);

-- 15. RESULT EVIDENCE (photo uploads per result)
CREATE TABLE IF NOT EXISTS public.result_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID REFERENCES public.election_results(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by_agent UUID REFERENCES public.agents(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.result_evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access result_evidence" ON public.result_evidence;
CREATE POLICY "Full access result_evidence" ON public.result_evidence FOR ALL USING (true);

-- ============================================================
-- DONE! Default admin login:
-- Email: admin@g-one.org
-- Password: admin123
-- ⚠️ CHANGE THIS PASSWORD IMMEDIATELY via the admin profile page
-- ============================================================

-- ============================================================
-- STORAGE BUCKETS NEEDED (create manually in Supabase Dashboard):
-- 1. "site-assets" (PUBLIC) — favicon, OG images
-- 2. "photos" (PUBLIC) — supporter profile photos
-- 3. "evidence" (PUBLIC) — election result sheet photos
-- 4. "media" (PUBLIC) — for manifesto PDFs and other uploads
-- ============================================================
