# 🚀 Como Rodar a Aplicação Localmente

## Pré-requisito

**Node.js 22+** (o backend usa `node:sqlite`, integrado ao Node — nenhuma compilação nativa).

```powershell
node --version   # precisa ser >= 22
npm --version
```

Se ainda não tem, baixe a LTS em https://nodejs.org/ e reinicie o terminal depois de instalar.

## Instalação

```powershell
npm install
```

Isso instala tanto o frontend (Vite + React) quanto o backend (Express + SQLite) e o servidor MCP.

## Rodando tudo de uma vez

```powershell
npm run dev:all
```

Isso sobe:

| Serviço | URL | O que faz |
|--------|-----|----------|
| Frontend Vite | http://localhost:8080 | Interface do app |
| API Express  | http://localhost:3001 | CRUD sobre `server/data/finance.db` |

Na primeira execução o banco é criado automaticamente e populado com o seed
padrão (2 perfis, 3 rendas, 11 despesas). Depois disso, tudo que você criar
pela interface é gravado direto no SQLite — não há mais dependência de
`localStorage`.

## Comandos separados

| Comando | O que faz |
|---------|-----------|
| `npm run dev`        | Só o frontend (Vite) na porta 8080 |
| `npm run server`     | Só o backend (Express + SQLite) na porta 3001 |
| `npm run server:seed`| Rodar o seed manualmente (idempotente) |
| `npm run mcp`        | Sobe o servidor MCP em stdio |
| `npm run build`      | Build de produção do frontend |
| `npm run lint`       | ESLint no projeto |

## Onde ficam os dados

`server/data/finance.db` — arquivo SQLite único. Está no `.gitignore`.

Se quiser começar do zero, apague o arquivo e rode `npm run server` de novo.

## Servidor MCP — testes automatizados

O servidor MCP (`mcp-server/index.js`) compartilha o **mesmo** banco do
backend e expõe 13 tools para consultar, alterar dados e rodar a suíte de
testes:

| Tool                     | Descrição |
|--------------------------|-----------|
| `list_profiles`          | Todos os perfis familiares |
| `list_incomes`           | Filtrar por mês/ano/perfil |
| `list_expenses`          | Filtrar por mês/ano/perfil/status/tipo |
| `get_summary`            | Totais, comprometimento salarial, gastos por tipo/dia |
| `financial_health`       | Score 0–100 |
| `add_income`             | Insere uma renda |
| `add_expense`            | Insere uma despesa |
| `toggle_expense_status`  | Pago ↔ não pago |
| `delete_expense`         | Remove por ID |
| `delete_income`          | Remove por ID |
| `add_profile`            | Novo perfil familiar |
| `api_health`             | GET em `/api/health` do Express |
| `run_test_suite`         | 11 checks de schema + integridade + API |

### Rodando os testes

Com o backend de pé (opcional, dá +1 teste):

```powershell
npm run server    # em outro terminal
```

Rodar o suite em modo one-shot:

```powershell
node --input-type=module -e "import('./mcp-server/index.js')" &
# ou plugar em qualquer cliente MCP e chamar a tool run_test_suite
```

### Plugar em um cliente MCP

Configure seu cliente com este comando:

```json
{
  "mcpServers": {
    "meu-bolso": {
      "command": "node",
      "args": ["mcp-server/index.js"],
      "cwd": "C:/Users/p.sousa.figueiredo/Documents/meu-bolso-feliz"
    }
  }
}
```

## Variáveis de ambiente

Ver `.env.example`. As duas usadas:

- `VITE_API_URL` — URL da API que o frontend chama (default `http://localhost:3001`)
- `PORT`        — Porta do Express (default `3001`)

## Modo Supabase (banco na nuvem, sync entre dispositivos)

### O que muda

Quando `VITE_SUPABASE_URL` está setado, o app usa **Supabase (Postgres na nuvem)**
em vez do IndexedDB do navegador. Consequências:

- Dados sincronizam entre celular/PC/qualquer navegador
- Login por email + senha (Supabase Auth)
- RLS garante que só você acessa seus dados
- Não depende mais de manter o `seed.enc.json` atualizado no repo
- Free forever no plano gratuito do Supabase (500MB DB)

### Setup do zero

1. **Criar projeto no Supabase**
   - https://supabase.com/dashboard → **New project**
   - Anote a **Project URL** e a **anon public key** (Settings → API)

2. **Rodar a migration SQL**
   - Dashboard → **SQL Editor** → cole o conteúdo de
     `supabase/migrations/0001_init.sql` → **Run**

3. **Configurar .env local** (para dev/build local)

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

4. **Configurar secrets do GitHub Actions** (para o deploy automático)
   - Repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Cria `VITE_SUPABASE_URL` (valor = mesma URL)
   - Cria `VITE_SUPABASE_PUBLISHABLE_KEY` (valor = mesma anon key)

5. **Criar usuário na primeira visita**
   - Abre o app publicado → clica em "Não tenho conta — criar uma"
   - Coloca email + senha (mínimo 6 caracteres)
   - Se a confirmação por email estiver ativa no projeto Supabase, verifica a caixa

6. **Importar seus dados (primeira vez)**
   - Depois de logado, canto inferior direito → botão de download
   - Digita a senha do seed criptografado (`PedroeYasmim` ou a que você trocou)
   - Popula sua conta com os 205 lançamentos originais

### Se der erro "row-level security policy" nas queries

Provavelmente a migration SQL não rodou. Confere:
- Dashboard → Table Editor → devem existir `profiles`, `incomes`, `expenses`, `debt_groups`
- Se não existirem, roda `supabase/migrations/0001_init.sql` novamente

### Como saber qual backend está ativo

O `storage.ts` decide na ordem:
1. `VITE_STORAGE` explícito (`supabase` | `api` | `local`)
2. Se `VITE_SUPABASE_URL` está setado → **supabase**
3. Se `/api/health` responde → **api** (Express local)
4. Fallback → **local** (IndexedDB)

Para forçar um modo, defina `VITE_STORAGE` no `.env` ou nas env vars do build.

## Deploy no GitHub Pages

O deploy é automático: qualquer push na `main` dispara o workflow
`.github/workflows/deploy.yml`, que builda o app e publica em
https://phsfigueiredo.github.io/meu-bolso-feliz/.

### Como o app funciona online

- GitHub Pages só serve arquivos estáticos → o backend Express **não sobe** lá.
- No build, `VITE_STORAGE=local` força o app a usar **IndexedDB** no navegador.
- Na primeira visita, o app baixa `seed.json` (embutido no build) e popula o
  IndexedDB. A partir daí, tudo que você edita fica salvo no navegador.
- Se limpar cache do navegador, o app recarrega do `seed.json`.

### Atualizando o seed com sua massa atual

Depois de mexer nos dados localmente (via app ou MCP), rode:

```powershell
npm run seed:export
```

Isso reescreve `public/seed.json` a partir do SQLite local. Faça commit +
push e a próxima visita ao site (após limpar o IndexedDB) verá a massa nova.

### Habilitando GitHub Pages no repositório

Só na primeira vez:

1. GitHub → **Settings** → **Pages**
2. Em **Source**, escolha **GitHub Actions**

O primeiro deploy roda automaticamente no push seguinte.

## Solução de problemas

**"ECONNREFUSED :3001"** — o frontend está rodando mas o backend não. Rode `npm run server` em outro terminal ou use `npm run dev:all`.

**Quero resetar o banco** — pare o backend, apague `server/data/finance.db` e reinicie. O seed roda automaticamente se o banco estiver vazio.

**"ExperimentalWarning: SQLite is an experimental feature"** — mensagem esperada do Node 22–24. Não afeta o funcionamento.
