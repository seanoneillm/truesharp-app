-- Create seller_profiles table for customization data
create table public.seller_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  bio text null,
  profile_img text null,
  banner_img text null,
  updated_at timestamptz not null default now(),
  constraint seller_profiles_pkey primary key (id),
  constraint seller_profiles_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade,
  constraint seller_profiles_user_id_unique unique (user_id)
) tablespace pg_default;

-- Add RLS policies
alter table public.seller_profiles enable row level security;

-- Policy: Users can view all seller profiles (public)
create policy "Anyone can view seller profiles"
  on public.seller_profiles for select
  using (true);

-- Policy: Users can only update their own seller profile
create policy "Users can update own seller profile"
  on public.seller_profiles for update
  using (auth.uid() = user_id);

-- Policy: Users can only insert their own seller profile
create policy "Users can insert own seller profile"
  on public.seller_profiles for insert
  with check (auth.uid() = user_id);

-- Policy: Users can only delete their own seller profile
create policy "Users can delete own seller profile"
  on public.seller_profiles for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists idx_seller_profiles_user_id 
  on public.seller_profiles using btree (user_id);

-- Create trigger for updated_at
create or replace function update_seller_profiles_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_seller_profiles_updated_at
  before update on public.seller_profiles
  for each row execute function update_seller_profiles_updated_at();