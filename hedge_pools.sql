-- SQL Migration for Multi-Investor Hedges & Pooled Accounts

-- 1. Create hedge_pools table
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

-- 2. Create hedge_pool_members table
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

-- 3. Enable RLS
alter table public.hedge_pools enable row level security;
alter table public.hedge_pool_members enable row level security;

-- 4. RLS Policies
create policy "Hedge pools viewable by authenticated users."
  on public.hedge_pools for select
  using ( auth.role() = 'authenticated' );

create policy "Pool members viewable by authenticated users."
  on public.hedge_pool_members for select
  using ( auth.role() = 'authenticated' );

-- Admins handle inserts, updates, and deletes via service role or direct admin actions.
