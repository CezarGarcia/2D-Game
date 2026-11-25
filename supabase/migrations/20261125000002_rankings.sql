-- Etapa 5, fase 2: tentativas de ranking e os rankings (docs/gdd/12-online.md).
-- Só o servidor (a função `tentativa`, com a chave service_role) escreve aqui; o jogador lê as próprias
-- tentativas e todo mundo lê os rankings pelas funções abaixo, que só mostram apelido e resultado.

create table if not exists public.tentativas (
  id uuid primary key default gen_random_uuid(),
  jogador uuid not null references public.jogadores (id) on delete cascade,
  modo text not null check (modo in ('dia', 'encantados')),
  -- dia: AAAA-MM-DD (dia de Brasília); encantados: 'geral'
  chave text not null,
  -- versão da simulação com que a partida foi jogada e refeita
  sim text not null,
  heroi jsonb not null,
  estado text not null default 'aberta' check (estado in ('aberta', 'verificada', 'rejeitada')),
  -- conta para o ranking (no Desafio do Dia, só a primeira tentativa do dia)
  valendo boolean not null default false,
  venceu boolean,
  salas int,
  tempo_ms int,
  arma text,
  motivo text,
  gravacao jsonb,
  criada_em timestamptz not null default now(),
  enviada_em timestamptz
);

-- no Desafio do Dia, uma tentativa valendo por jogador e por dia
create unique index if not exists tentativas_uma_valendo_por_dia on public.tentativas (jogador, chave) where modo = 'dia' and valendo;
create index if not exists tentativas_ranking on public.tentativas (modo, chave, sim, venceu desc, salas desc, tempo_ms) where estado = 'verificada' and valendo;
create index if not exists tentativas_do_jogador on public.tentativas (jogador, modo, chave);

alter table public.tentativas enable row level security;
drop policy if exists "lê as próprias tentativas" on public.tentativas;
create policy "lê as próprias tentativas" on public.tentativas for select using (auth.uid() = jogador);

-- A melhor tentativa valendo de cada jogador num ranking, já em ordem: vencer, mais salas, menos tempo, quem enviou antes.
create or replace function public.ranking_linhas(p_modo text, p_chave text, p_sim text)
returns table (jogador uuid, apelido text, venceu boolean, salas int, tempo_ms int, arma text, posicao bigint)
language sql stable security definer set search_path = public as $$
  with melhor as (
    select distinct on (t.jogador) t.jogador, t.venceu, t.salas, t.tempo_ms, t.arma, t.enviada_em
    from tentativas t
    where t.modo = p_modo and t.chave = p_chave and t.sim = p_sim and t.estado = 'verificada' and t.valendo
    order by t.jogador, t.venceu desc, t.salas desc, t.tempo_ms asc, t.enviada_em asc
  )
  select m.jogador, j.apelido, m.venceu, m.salas, m.tempo_ms, m.arma,
    row_number() over (order by m.venceu desc, m.salas desc, m.tempo_ms asc, m.enviada_em asc) as posicao
  from melhor m join jogadores j on j.id = m.jogador
$$;
revoke all on function public.ranking_linhas(text, text, text) from public, anon, authenticated;

-- O topo de um ranking.
create or replace function public.ranking(p_modo text, p_chave text, p_sim text, p_limite int default 20)
returns table (apelido text, venceu boolean, salas int, tempo_ms int, arma text, posicao bigint)
language sql stable security definer set search_path = public as $$
  select r.apelido, r.venceu, r.salas, r.tempo_ms, r.arma, r.posicao
  from ranking_linhas(p_modo, p_chave, p_sim) r
  order by r.posicao limit least(greatest(p_limite, 1), 100)
$$;
grant execute on function public.ranking(text, text, text, int) to anon, authenticated;

-- A posição de quem está logado e quantos jogadores há no ranking.
create or replace function public.minha_posicao(p_modo text, p_chave text, p_sim text)
returns table (posicao bigint, total bigint, venceu boolean, salas int, tempo_ms int, arma text)
language sql stable security definer set search_path = public as $$
  with r as (select * from ranking_linhas(p_modo, p_chave, p_sim))
  select r.posicao, (select count(*) from r), r.venceu, r.salas, r.tempo_ms, r.arma
  from r where r.jogador = auth.uid()
$$;
grant execute on function public.minha_posicao(text, text, text) to authenticated;
