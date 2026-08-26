-- MASTER SQL SCHEMA UPDATE FOR HEDGE CAPITAL DASHBOARD
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/osdgugmnzoanaubxveua/sql)

-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  email text,
  role text default 'client'::text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create invested_capital table
create table if not exists public.invested_capital (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount_invested numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create ledger table
create table if not exists public.ledger (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  current_value numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'fee')),
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Create hedge_pools table
create table if not exists public.hedge_pools (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  strategy text not null default 'Balanced Alpha',
  description text,
  total_capital numeric not null default 0,
  current_value numeric not null default 0,
  target_return text default '18-24% APY',
  status text default 'active' check (status in ('active', 'closed', 'rebalancing')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Create hedge_pool_members table
create table if not exists public.hedge_pool_members (
  id uuid default uuid_generate_v4() primary key,
  pool_id uuid references public.hedge_pools(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  allocated_amount numeric not null default 0,
  split_percentage numeric not null default 0,
  current_member_value numeric not null default 0,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (pool_id, user_id)
);

-- 7. Create hedge_pool_trades table
create table if not exists public.hedge_pool_trades (
  id uuid default uuid_generate_v4() primary key,
  pool_id uuid references public.hedge_pools(id) on delete cascade not null,
  asset_symbol text not null,
  trade_type text not null check (trade_type in ('BUY_LONG', 'SELL_SHORT', 'PROFIT_TAKE', 'STOP_LOSS')),
  position_size numeric not null default 0,
  entry_price numeric,
  exit_price numeric,
  pnl_amount numeric not null default 0,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Create reset_requests table (Admin-approved Password Resets & Whitelist Applications)
create table if not exists public.reset_requests (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.invested_capital enable row level security;
alter table public.ledger enable row level security;
alter table public.transactions enable row level security;
alter table public.hedge_pools enable row level security;
alter table public.hedge_pool_members enable row level security;
alter table public.hedge_pool_trades enable row level security;
alter table public.reset_requests enable row level security;

-- 10. Clean up and recreate RLS Policies safely
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Users view own transactions" on public.transactions;
drop policy if exists "Users can view their own transactions." on public.transactions;
drop policy if exists "Hedge pools viewable by authenticated users" on public.hedge_pools;
drop policy if exists "Pool members viewable by authenticated users" on public.hedge_pool_members;
drop policy if exists "Pool trades viewable by authenticated users" on public.hedge_pool_trades;
drop policy if exists "Public reset requests insert" on public.reset_requests;
drop policy if exists "Public reset requests select" on public.reset_requests;

create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );
create policy "Users view own transactions" on public.transactions for select using ( auth.uid() = user_id );
create policy "Hedge pools viewable by authenticated users" on public.hedge_pools for select using ( auth.role() = 'authenticated' );
create policy "Pool members viewable by authenticated users" on public.hedge_pool_members for select using ( auth.role() = 'authenticated' );
create policy "Pool trades viewable by authenticated users" on public.hedge_pool_trades for select using ( auth.role() = 'authenticated' );
create policy "Public reset requests insert" on public.reset_requests for insert with check ( true );
create policy "Public reset requests select" on public.reset_requests for select using ( true );

-- 11. Auto profile creation trigger on Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Investor'),
    coalesce(new.raw_user_meta_data->>'role', 'client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
