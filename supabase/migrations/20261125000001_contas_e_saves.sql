-- Etapa 5, fase 1: jogadores, apelidos e o save na nuvem (docs/gdd/12-online.md).
-- Rode no SQL Editor do Supabase ou com `supabase db push`.

-- ---------- jogadores ----------
create table if not exists public.jogadores (
  id uuid primary key references auth.users (id) on delete cascade,
  apelido text not null,
  criado_em timestamptz not null default now(),
  constraint apelido_formato check (apelido ~ '^[A-Za-z0-9À-ÖØ-öø-ÿ_ ]{3,16}$' and apelido = btrim(apelido))
);
create unique index if not exists jogadores_apelido_unico on public.jogadores (lower(apelido));

alter table public.jogadores enable row level security;

-- qualquer um lê apelidos (para os rankings); cada um cria e muda só o seu
drop policy if exists "apelidos são públicos" on public.jogadores;
create policy "apelidos são públicos" on public.jogadores for select using (true);
drop policy if exists "cria o próprio jogador" on public.jogadores;
create policy "cria o próprio jogador" on public.jogadores for insert with check (auth.uid() = id);
drop policy if exists "muda o próprio apelido" on public.jogadores;
create policy "muda o próprio apelido" on public.jogadores for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- saves ----------
-- Um save por jogador e por mundo. O Mundo Solo é escrito pelo navegador; o Mundo Online, só pelo servidor (fase 4).
create table if not exists public.saves (
  jogador uuid not null references public.jogadores (id) on delete cascade,
  mundo text not null default 'solo' check (mundo in ('solo', 'online')),
  rev bigint not null default 1,
  versao int not null,
  nivel int not null default 1,
  tempo_jogo int not null default 0,
  perfil jsonb not null,
  aparelho text,
  atualizado_em timestamptz not null default now(),
  primary key (jogador, mundo),
  constraint perfil_tamanho check (octet_length(perfil::text) < 2000000)
);

alter table public.saves enable row level security;

drop policy if exists "lê o próprio save" on public.saves;
create policy "lê o próprio save" on public.saves for select using (auth.uid() = jogador);
-- escrita só pela função salvar_solo, que confere a revisão

-- Grava o save do Mundo Solo se ninguém gravou outro depois de `base_rev` (0 = primeiro save).
-- Devolve a revisão nova, ou -1 com a revisão atual quando outro aparelho gravou antes (conflito).
create or replace function public.salvar_solo(perfil jsonb, base_rev bigint, versao int, nivel int, tempo_jogo int, aparelho text)
returns table (ok boolean, rev bigint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare
  eu uuid := auth.uid();
  atual bigint;
begin
  if eu is null then raise exception 'sem login'; end if;
  if not exists (select 1 from jogadores j where j.id = eu) then raise exception 'escolha um apelido antes'; end if;
  select s.rev into atual from saves s where s.jogador = eu and s.mundo = 'solo' for update;
  if atual is null then
    if base_rev <> 0 then return query select false, 0::bigint; return; end if;
    insert into saves (jogador, mundo, rev, versao, nivel, tempo_jogo, perfil, aparelho)
      values (eu, 'solo', 1, salvar_solo.versao, salvar_solo.nivel, salvar_solo.tempo_jogo, salvar_solo.perfil, salvar_solo.aparelho);
    return query select true, 1::bigint; return;
  end if;
  if atual <> base_rev then return query select false, atual; return; end if;
  update saves s set rev = atual + 1, versao = salvar_solo.versao, nivel = salvar_solo.nivel, tempo_jogo = salvar_solo.tempo_jogo,
    perfil = salvar_solo.perfil, aparelho = salvar_solo.aparelho, atualizado_em = now()
    where s.jogador = eu and s.mundo = 'solo';
  return query select true, atual + 1;
end $$;

revoke all on function public.salvar_solo(jsonb, bigint, int, int, int, text) from public, anon;
grant execute on function public.salvar_solo(jsonb, bigint, int, int, int, text) to authenticated;

-- LGPD: apaga a conta e tudo o que é dela (o cascade leva jogador, saves e, depois, tentativas).
create or replace function public.apagar_minha_conta()
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'sem login'; end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function public.apagar_minha_conta() from public, anon;
grant execute on function public.apagar_minha_conta() to authenticated;
