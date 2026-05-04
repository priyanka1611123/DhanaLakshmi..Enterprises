-- ================================================================
--  DL Enterprises – Supabase Database Setup
--  COPY this entire file and paste into:
--  Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================

-- 1. INVOICES TABLE
create table if not exists invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  inv_no          text not null,
  date            text not null,
  due             text not null,
  customer        text not null,
  customer_id     uuid,
  customer_gstin  text,
  customer_address text,
  status          text default 'pending' check (status in ('pending','paid','overdue')),
  notes           text,
  items           jsonb not null default '[]',
  created_at      timestamptz default now()
);

-- 2. CUSTOMERS TABLE
create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  gstin       text,
  phone       text,
  email       text,
  address     text,
  created_at  timestamptz default now()
);

-- 3. SETTINGS TABLE
create table if not exists settings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null unique,
  name                text,
  tagline             text,
  gstin               text,
  phone               text,
  email               text,
  address             text,
  prefix              text default 'DL',
  bank                text,
  account             text,
  ifsc                text,
  emailjs_service_id  text,
  emailjs_template_id text,
  emailjs_public_key  text,
  updated_at          timestamptz default now()
);

-- 4. ROW LEVEL SECURITY (each user sees only their own data)
alter table invoices  enable row level security;
alter table customers enable row level security;
alter table settings  enable row level security;

-- Invoices policies
create policy "Users can view own invoices"
  on invoices for select using (auth.uid() = user_id);
create policy "Users can insert own invoices"
  on invoices for insert with check (auth.uid() = user_id);
create policy "Users can update own invoices"
  on invoices for update using (auth.uid() = user_id);
create policy "Users can delete own invoices"
  on invoices for delete using (auth.uid() = user_id);

-- Customers policies
create policy "Users can view own customers"
  on customers for select using (auth.uid() = user_id);
create policy "Users can insert own customers"
  on customers for insert with check (auth.uid() = user_id);
create policy "Users can update own customers"
  on customers for update using (auth.uid() = user_id);
create policy "Users can delete own customers"
  on customers for delete using (auth.uid() = user_id);

-- Settings policies
create policy "Users can view own settings"
  on settings for select using (auth.uid() = user_id);
create policy "Users can insert own settings"
  on settings for insert with check (auth.uid() = user_id);
create policy "Users can update own settings"
  on settings for update using (auth.uid() = user_id);

-- 5. INDEXES for performance
create index if not exists idx_invoices_user_id  on invoices(user_id);
create index if not exists idx_customers_user_id on customers(user_id);
create index if not exists idx_invoices_status   on invoices(status);

-- Done! You should see: "Success. No rows returned"

-- 6. DAILY SALES TABLE
create table if not exists daily_sales (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null,
  sale_amount  numeric(12,2) default 0,
  expense      numeric(12,2) default 0,
  category     text default 'General',
  note         text,
  created_at   timestamptz default now()
);

alter table daily_sales enable row level security;

create policy "Users can view own daily_sales"
  on daily_sales for select using (auth.uid() = user_id);
create policy "Users can insert own daily_sales"
  on daily_sales for insert with check (auth.uid() = user_id);
create policy "Users can update own daily_sales"
  on daily_sales for update using (auth.uid() = user_id);
create policy "Users can delete own daily_sales"
  on daily_sales for delete using (auth.uid() = user_id);

create index if not exists idx_daily_sales_user_id on daily_sales(user_id);
create index if not exists idx_daily_sales_date    on daily_sales(date);
