-- Create posts table (if it doesn't exist)
create table if not exists public.posts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  content text not null,
  image_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
) tablespace pg_default;

-- Create indexes
create index if not exists idx_posts_user_id on public.posts using btree (user_id) tablespace pg_default;
create index if not exists idx_posts_created_at on public.posts using btree (created_at) tablespace pg_default;

-- Enable Row Level Security
alter table public.posts enable row level security;

-- Create policies
create policy "Posts are viewable by everyone" on posts
  for select using (true);

create policy "Users can create posts" on posts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own posts" on posts
  for update using (auth.uid() = user_id);

create policy "Users can delete own posts" on posts
  for delete using (auth.uid() = user_id);

-- Create storage bucket for post images (if it doesn't exist)
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Create storage policies
create policy "Anyone can view post images" on storage.objects
  for select using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images" on storage.objects
  for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "Users can update own post images" on storage.objects
  for update using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own post images" on storage.objects
  for delete using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);