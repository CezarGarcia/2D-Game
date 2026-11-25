# Ligar a parte online

O código já está pronto. Faltam os passos que só o dono das contas pode fazer: criar o projeto no Supabase, ligar o login do Google e ativar o GitHub Pages. Leva uns 20 minutos e não custa nada.

O endereço do jogo vai ser `https://cezargarcia.github.io/2D-Game/`.

## 1. Publicar o jogo no GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Pronto. A cada envio para a `main`, o fluxo `.github/workflows/pages.yml` roda os testes, gera o jogo e publica. A primeira publicação aparece na aba **Actions**.

O GitHub Pages gratuito exige repositório **público**. Se o repositório for privado, torne-o público em **Settings → General → Danger Zone**, ou use o Cloudflare Pages (também gratuito, aceita repositório privado).

Até o passo 4, o jogo publicado funciona sem a parte online: salva só no navegador, como hoje.

## 2. Criar o projeto no Supabase

1. Crie uma conta em <https://supabase.com> e clique em **New project**.
2. Nome: `encantados`. Região: **South America (São Paulo)**. Guarde a senha do banco.
3. Com o projeto criado, abra **SQL Editor**, cole o conteúdo de cada arquivo de `supabase/migrations/`, em ordem de nome, e clique em **Run** em cada um.
4. Em **Project Settings → API**, copie dois valores:
   - **Project URL** (algo como `https://abcd1234.supabase.co`);
   - a chave **anon public**.

A chave `anon` é pública: ela vai dentro do jogo. A chave `service_role` é secreta e não deve ser colada em lugar nenhum fora do Supabase.

## 3. Login

Em **Authentication → URL Configuration**:

- **Site URL:** `https://cezargarcia.github.io/2D-Game/`
- **Redirect URLs:** adicione `https://cezargarcia.github.io/2D-Game/` e, para testar no computador, `http://localhost:5173/`.

**Link por e-mail** já vem ligado (Authentication → Providers → Email). O plano gratuito manda poucos e-mails por hora; serve para testar. Com jogadores de verdade, configure um serviço de e-mail em **Authentication → SMTP**.

**Google:**

1. No [Google Cloud Console](https://console.cloud.google.com/), crie um projeto e abra **APIs e serviços → Tela de permissão OAuth**. Tipo **Externo**, nome `Encantados`, seu e-mail de contato. Publique o app.
2. Em **Credenciais → Criar credenciais → ID do cliente OAuth**, tipo **Aplicativo da Web**.
   - **Origens JavaScript autorizadas:** `https://cezargarcia.github.io`
   - **URIs de redirecionamento autorizados:** o endereço que o Supabase mostra em **Authentication → Providers → Google** (termina em `/auth/v1/callback`).
3. Copie o **ID do cliente** e a **chave secreta** para **Authentication → Providers → Google** no Supabase e ligue o provedor.

## 4. Dar o endereço do Supabase ao jogo

No repositório, em **Settings → Secrets and variables → Actions → aba Variables**, crie duas variáveis:

| Nome | Valor |
|---|---|
| `VITE_SUPABASE_URL` | o Project URL do passo 2 |
| `VITE_SUPABASE_ANON_KEY` | a chave anon public do passo 2 |

Depois rode o fluxo de novo: **Actions → Publicar o jogo → Run workflow**. Na próxima publicação, o botão **Entrar** aparece em Opções (a engrenagem).

## 5. Conferir

1. Abra o jogo, vá em **Opções → Entrar**, entre com o Google e escolha um apelido.
2. Jogue uma fase. Em Opções, a conta deve mostrar "Salvo na nuvem".
3. Abra o jogo em outro navegador, entre com a mesma conta: o progresso aparece.
4. No Supabase, em **Table Editor**, as tabelas `jogadores` e `saves` têm uma linha cada.

## Testar no computador

```bash
cp .env.example .env.local
```

Preencha os dois valores e rode `npm run dev`. Sem um projeto Supabase, `http://localhost:5173/?nuvem=falsa` usa um servidor de mentira guardado no navegador, só para ver as telas.

## Custos

Nada enquanto for teste. O plano gratuito do Supabase pausa um projeto parado há uma semana (basta reativar no painel). Com jogadores de verdade, o plano Pro custa US$ 25 por mês.
