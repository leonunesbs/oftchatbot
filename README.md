# oftcore (Monorepo)

Monorepo para os projetos:

- `oftagenda` (Next.js + Convex)
- `oftleonardo` (Astro)

## Estrutura

```text
.
├── oftagenda
├── oftleonardo
├── package.json
└── pnpm-workspace.yaml
```

## Requisitos

- Node.js 20+
- pnpm 10+

## Instalação

```bash
pnpm install
```

## Comandos unificados

### Rodar tudo junto

```bash
pnpm dev
pnpm run dev:all:web
```

Para subir também o Convex do `oftagenda`:

```bash
pnpm run dev:all:full
```

### Rodar individualmente

```bash
pnpm run dev:agenda
pnpm run dev:agenda:full
pnpm run dev:leonardo
```

`dev:agenda` e `dev:agenda:full` iniciam o painel completo do `oftagenda` (Next.js + Convex).

### Build

```bash
pnpm run build
pnpm run build:agenda
pnpm run build:leonardo
```

### Outros

```bash
pnpm run lint
pnpm run type-check
pnpm run preview:leonardo
```

## Portas padronizadas

Para evitar conflito ao executar simultaneamente:

- `oftagenda` (Next.js): `http://localhost:3001`
- `oftleonardo` (Astro): `http://localhost:4331`
- `Convex dev` (dentro do `oftagenda`): mantém a porta padrão do Convex no processo de desenvolvimento

Obs.: as portas podem ser sobrescritas por variável de ambiente:

- `NEXT_PORT` para `oftagenda`
- `PORT` para `oftleonardo`

## Método de deploy recomendado

### Melhor estratégia: deploy separado por app no mesmo monorepo (Vercel)

Cada app deve ser configurado como um projeto independente na Vercel, apontando para subdiretórios:

- Projeto A -> Root Directory: `oftagenda`
- Projeto B -> Root Directory: `oftleonardo`

**Por que esse método é o melhor aqui:**

- isolamento de variáveis de ambiente (Clerk/Convex no `oftagenda`, Cal/API no `oftleonardo`);
- builds menores e mais rápidos por app;
- rollback independente;
- domínio/subdomínio por projeto sem acoplamento.

### Configuração sugerida

- Framework detectado automaticamente por app (Next.js e Astro).
- Install Command: `pnpm install --frozen-lockfile`
- Build Command:
  - `oftagenda`: `pnpm --filter ./oftagenda build`
  - `oftleonardo`: `pnpm --filter ./oftleonardo build`

### Alternativas (quando considerar)

- **Turborepo + Remote Cache**: útil se crescer para muitos apps/pacotes compartilhados.
- **Deploy único**: não recomendado neste cenário, porque une ciclos de deploy e aumenta risco de impacto cruzado.

## Acesso isolado no GitHub

Para manter o monorepo como fonte principal e continuar com acesso isolado por projeto, foi adicionado o workflow:

- `.github/workflows/split-repositories.yml`

Ele sincroniza automaticamente:

- `oftagenda/` -> `leonunesbs/oftagenda`
- `oftleonardo/` -> `leonunesbs/oftleonardo`

### Como configurar no GitHub

No repositório monorepo (`oftcore`), adicione dois secrets de Actions:

- `OFTAGENDA_REPO_TOKEN`
- `OFTLEONARDO_REPO_TOKEN`

Recomendação:

- usar **Fine-grained PAT** separado para cada secret;
- cada token com acesso somente ao respectivo repositório de destino;
- permissão mínima: `Contents: Read and write`.

Assim, você mantém isolamento de acesso (cada token só publica em um repo).

### Fluxo recomendado

- Fazer alterações apenas no monorepo.
- Não editar diretamente os repositórios espelho.
- Cada push para `main` dispara a sincronização dos dois repos.
