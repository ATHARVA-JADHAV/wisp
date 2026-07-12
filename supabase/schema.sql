-- Wisp schema — run this once in Supabase SQL Editor (Dashboard → SQL Editor → New query)
create extension if not exists vector;

-- ── projects (tenants) ──────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  public_key text not null unique default ('prj_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
  bot_name text not null default 'Wisp',
  greeting text not null default 'Hi! Ask me anything about this site.',
  accent_color text not null default '#8b5cf6',
  created_at timestamptz not null default now()
);

-- ── knowledge sources ───────────────────────────────────────────────────────
create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  type text not null check (type in ('url', 'text')),
  url text,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'indexed', 'error')),
  error text,
  chunk_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ── embedded chunks ─────────────────────────────────────────────────────────
create table if not exists chunks (
  id bigint generated always as identity primary key,
  project_id uuid not null references projects(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  created_at timestamptz not null default now()
);
create index if not exists chunks_embedding_idx on chunks using hnsw (embedding vector_cosine_ops);
create index if not exists chunks_project_idx on chunks (project_id);

-- ── conversations & messages ────────────────────────────────────────────────
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  visitor_id text, -- anonymous id from the widget's localStorage; groups return visits
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  grounded boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_idx on messages (conversation_id);

-- ── similarity search (called with service role from /api/chat) ─────────────
create or replace function match_chunks(
  p_project_id uuid,
  p_query_embedding vector(768),
  p_match_count int default 5
)
returns table (content text, similarity float)
language sql stable as $$
  select c.content, 1 - (c.embedding <=> p_query_embedding) as similarity
  from chunks c
  where c.project_id = p_project_id
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;

-- ── RLS: owners see only their rows; chunks are service-role-only ───────────
alter table projects enable row level security;
alter table sources enable row level security;
alter table chunks enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "own projects" on projects for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

create policy "own sources" on sources for all
  using (exists (select 1 from projects p where p.id = project_id and p.owner = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_id and p.owner = auth.uid()));

-- chunks: no client policies at all — only the service role (bypasses RLS) touches them

create policy "own conversations" on conversations for select
  using (exists (select 1 from projects p where p.id = project_id and p.owner = auth.uid()));

create policy "own messages" on messages for select
  using (exists (
    select 1 from conversations c join projects p on p.id = c.project_id
    where c.id = conversation_id and p.owner = auth.uid()
  ));
