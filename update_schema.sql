-- 1. Create transactions table to track deposits, withdrawals, and profit cuts
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('deposit', 'withdrawal', 'fee')),
  amount numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.transactions enable row level security;

-- 3. RLS policies (Clients can view their own, Admins can do anything via service role)
create policy "Users can view their own transactions."
  on public.transactions for select
  using ( auth.uid() = user_id );

-- Notes: 
-- We don't allow users to insert their own transactions. 
-- All insertions will be done securely via the Admin dashboard using the Supabase Service Role key (which bypasses RLS).
