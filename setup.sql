-- SQL Setup for Hedge Fund Dashboard

-- 1. Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  role text default 'client'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create invested_capital table
create table invested_capital (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  amount_invested numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create ledger table (for performance tracking)
create table ledger (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  current_value numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table invested_capital enable row level security;
alter table ledger enable row level security;

-- 5. Create basic RLS policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Admins can do anything (assuming you'll manually set your role to 'admin' in the db)
-- For simplicity, we are handling most inserts from the server via service_role,
-- which bypasses RLS anyway.

-- 6. Trigger to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
