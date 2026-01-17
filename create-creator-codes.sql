-- Creator Codes Feature Database Setup

-- 1. Create the creator_codes table
create table public.creator_codes (
  id uuid not null default gen_random_uuid(),
  creator_user_id uuid not null,
  code text not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint creator_codes_pkey primary key (id),
  constraint creator_codes_code_key unique (code),
  constraint creator_codes_creator_user_id_fkey foreign key (creator_user_id) references public.profiles (id) on delete cascade
) tablespace pg_default;

-- Index for looking up codes (case-insensitive)
create index idx_creator_codes_code_lower on public.creator_codes using btree (lower(code)) tablespace pg_default;

-- Index for looking up by creator
create index idx_creator_codes_creator_user_id on public.creator_codes using btree (creator_user_id) tablespace pg_default;

-- Index for active codes only
create index idx_creator_codes_active on public.creator_codes using btree (is_active) tablespace pg_default where (is_active = true);

-- 2. Add referred_by_code column to profiles table
alter table public.profiles add column referred_by_code text null;

-- Index for counting signups by creator code
create index idx_profiles_referred_by_code on public.profiles using btree (referred_by_code) tablespace pg_default where (referred_by_code is not null);

-- 3. Enable RLS on creator_codes table
alter table public.creator_codes enable row level security;

-- 4. RLS Policies for creator_codes

-- Allow anyone to read active codes (for validation during signup)
create policy "Anyone can read active creator codes"
  on public.creator_codes
  for select
  using (is_active = true);

-- Allow service role full access (for admin operations via API)
-- Note: Service role bypasses RLS by default, so no explicit policy needed

-- 5. Grant permissions
grant select on public.creator_codes to anon;
grant select on public.creator_codes to authenticated;

-- 6. Add column to track if user has seen referral welcome popup
alter table public.profiles add column has_seen_referral_welcome boolean default false;
