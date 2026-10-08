-- Run this whole file once in Supabase: SQL Editor > New query > Run

create table contacts(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  name text not null, email text, phone text, company text,
  status text default 'Lead' check (status in ('Lead','Active','Inactive')),
  lead_stage text default 'New' check (lead_stage in ('New','Contacted','Qualified','Lost','Won')),
  source text, past_orders text, total_spent numeric default 0, last_contact date, notes text);
create table deals(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  title text not null, contact_id uuid references contacts on delete set null,
  value numeric default 0, probability int default 50, expected_close date,
  stage text default 'New Inquiry' check (stage in ('New Inquiry','Meeting Scheduled','Quote Sent','Negotiation','Won','Lost')));
create table activities(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  contact_id uuid references contacts on delete cascade, type text, note text,
  occurred_on date default current_date, created_by uuid default auth.uid());
create table tasks(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  title text not null, contact_id uuid references contacts on delete set null,
  due_date date, done boolean default false);
create table tickets(
  id uuid primary key default gen_random_uuid(), created_at timestamptz default now(),
  ticket_no bigint generated always as identity,
  subject text not null, contact_id uuid references contacts on delete set null,
  status text default 'Open', priority text default 'Medium', description text);

-- No login: anyone with the site address can read and write this data.
do $$ declare t text; begin
  foreach t in array array['contacts','deals','activities','tasks','tickets'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "open access" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Optional sample data from your spreadsheet
insert into contacts(name,email,phone,company,status,past_orders,total_spent,last_contact,notes) values
('John Smith','john.smith@email.com','0412 345 678','ABC Pty Ltd','Active','Website Design Package',2500,'2026-10-05','Interested in ongoing support'),
('Sarah Johnson','sarah.j@email.com','0423 456 789','Johnson Legal','Active','Business Website, Hosting',3200,'2026-10-03','Requested hosting upgrade'),
('Michael Lee','michael.lee@email.com','0434 567 890','Lee Consulting','Lead','None',0,'2026-10-01','Requested quote'),
('Emma Brown','emma.brown@email.com','0445 678 901','Brown Real Estate','Active','Website Redesign',1800,'2026-10-06','Happy with project'),
('David Wilson','david.w@email.com','0456 789 012','Wilson Plumbing','Inactive','Website Design, SEO Setup',4100,'2026-09-20',null);
insert into deals(title,contact_id,value,probability,expected_close,stage)
select 'Website Project',id,2500,80,'2026-10-20','Negotiation' from contacts where email='john.smith@email.com';
