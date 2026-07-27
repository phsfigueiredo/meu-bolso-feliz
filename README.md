# Meu Bolso Feliz 💰

Aplicação de controle financeiro pessoal construída com React, TypeScript e Vite.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn

## 🚀 Como rodar localmente

### 1. Clone o repositório

```sh
git clone <URL_DO_SEU_REPOSITORIO>
cd meu-bolso-feliz
```

### 2. Instale as dependências

```sh
npm install
```

ou

```sh
yarn install
```

### 3. Inicie o servidor de desenvolvimento

```sh
npm run dev
```

ou

```sh
yarn dev
```

A aplicação estará disponível em `http://localhost:8080`

## 📦 Scripts disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter

## 🛠️ Tecnologias utilizadas

- **Vite** - Build tool e dev server
- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Componentes UI
- **React Router** - Roteamento
- **Recharts** - Gráficos e visualizações
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de esquemas

## 📁 Estrutura do projeto

```
meu-bolso-feliz/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilitários
│   ├── types/          # Tipos TypeScript
│   └── data/           # Dados mock
├── public/             # Arquivos estáticos
└── dist/               # Build de produção (gerado)
```

## 🚢 Deploy

Para fazer o build de produção:

```sh
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`, que pode ser deployada em qualquer serviço de hospedagem estática como:

- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Cloudflare Pages

## 📝 Licença

Este projeto é privado e de uso pessoal.
