# ✅ Checklist de Deploy - InfinityFree

## 📋 Pré-requisitos Verificados

- ✅ `vite.config.ts` configurado com `base: "./"` para paths relativos
- ✅ React Router usando `BrowserRouter` (compatível com `.htaccess`)
- ✅ `.htaccess` configurado com fallback para `index.html`
- ✅ Referências absolutas corrigidas (NotFound.tsx usa `Link` do React Router)
- ✅ Build gerando arquivos com paths relativos (`./assets/...`)

---

## 🚀 Comandos para Executar Localmente

### 1. Instalar dependências (se necessário)
```bash
npm install
```

### 2. Gerar build de produção
```bash
npm run build
```

Este comando irá:
- Compilar o projeto React + TypeScript
- Otimizar assets (minificação, tree-shaking)
- Gerar arquivos estáticos na pasta `dist/`
- Copiar automaticamente o `.htaccess` da pasta `public/` para `dist/`

### 3. (Opcional) Testar build localmente
```bash
npm run preview
```

Isso inicia um servidor local para testar a build antes de fazer upload.

---

## 📁 Arquivos para Enviar ao InfinityFree

### ✅ Enviar TODO o conteúdo da pasta `dist/` para `htdocs/`

**Estrutura esperada na pasta `htdocs` do InfinityFree:**

```
htdocs/
├── .htaccess          ← Arquivo de configuração Apache (ESSENCIAL)
├── index.html         ← Página principal
├── favicon.ico        ← Ícone do site
├── robots.txt         ← Arquivo para SEO
├── placeholder.svg    ← Imagem placeholder (se existir)
└── assets/            ← Pasta com arquivos JavaScript e CSS
    ├── index-XXXXX.js ← JavaScript compilado
    └── index-XXXXX.css ← CSS compilado
```

### ⚠️ IMPORTANTE

- ❌ **NÃO** enviar a pasta `dist` inteira
- ✅ Enviar **APENAS o CONTEÚDO** de dentro de `dist/`
- ✅ O arquivo `.htaccess` **DEVE** estar na raiz de `htdocs/`
- ✅ O `index.html` **DEVE** estar na raiz de `htdocs/`

---

## 🔧 Como Fazer Upload

### Opção 1: Via File Manager do InfinityFree
1. Acesse o painel de controle do InfinityFree
2. Vá em **File Manager**
3. Navegue até a pasta `htdocs/`
4. Faça upload de todos os arquivos da pasta `dist/` (conteúdo, não a pasta)
5. Certifique-se de que o `.htaccess` está visível (pode estar oculto)

### Opção 2: Via FTP
1. Conecte-se via FTP usando as credenciais do InfinityFree
2. Navegue até a pasta `htdocs/`
3. Faça upload de todos os arquivos da pasta `dist/`
4. Certifique-se de que o `.htaccess` foi enviado (arquivos ocultos podem precisar de configuração especial no cliente FTP)

---

## ✅ Verificações Pós-Deploy

Após fazer o upload, verifique:

1. **Página inicial carrega?**
   - Acesse `https://seudominio.com/`
   - Deve mostrar a aplicação React

2. **JavaScript e CSS carregam?**
   - Abra o DevTools (F12) → aba Network
   - Verifique se `index-XXXXX.js` e `index-XXXXX.css` carregam com status 200
   - Se retornar 404, verifique se a pasta `assets/` foi enviada corretamente

3. **Rotas funcionam?**
   - Navegue pela aplicação
   - Recarregue a página em qualquer rota
   - Não deve retornar erro 404 (graças ao `.htaccess`)

4. **Console sem erros?**
   - Abra o DevTools (F12) → aba Console
   - Não deve haver erros relacionados a módulos não encontrados

---

## 🐛 Problemas Comuns e Soluções

### ❌ Página em branco
**Causa:** JavaScript não está carregando ou paths incorretos
**Solução:**
- Verifique se `base: "./"` está no `vite.config.ts`
- Verifique se a pasta `assets/` foi enviada
- Verifique o console do navegador para erros específicos

### ❌ Erro 404 ao recarregar página
**Causa:** `.htaccess` não está funcionando ou não foi enviado
**Solução:**
- Certifique-se de que o `.htaccess` está na raiz de `htdocs/`
- Verifique se o InfinityFree suporta `mod_rewrite` (geralmente sim)
- Tente acessar diretamente `https://seudominio.com/.htaccess` para verificar se existe

### ❌ Assets (JS/CSS) retornam 404
**Causa:** Paths absolutos ou pasta `assets/` não enviada
**Solução:**
- Verifique se `base: "./"` está no `vite.config.ts`
- Refaça o build: `npm run build`
- Verifique se a pasta `assets/` está dentro de `htdocs/`

### ❌ Página carrega mas não funciona (erros no console)
**Causa:** Problemas com módulos ou dependências
**Solução:**
- Verifique o console do navegador para erros específicos
- Certifique-se de que fez `npm run build` (não use arquivos de desenvolvimento)

---

## 📝 Resumo Rápido

```bash
# 1. Gerar build
npm run build

# 2. Verificar conteúdo de dist/
# Deve conter: .htaccess, index.html, assets/, favicon.ico, etc.

# 3. Enviar TODO o conteúdo de dist/ para htdocs/ do InfinityFree

# 4. Acessar o site e verificar funcionamento
```

---

## ✨ Configurações Aplicadas

### `vite.config.ts`
- ✅ `base: "./"` - Garante paths relativos
- ✅ Compatível com desenvolvimento local e produção

### `.htaccess`
- ✅ Fallback para `index.html` (SPA routing)
- ✅ Compressão GZIP habilitada
- ✅ Cache de assets configurado

### React Router
- ✅ `BrowserRouter` mantido (funciona com `.htaccess`)
- ✅ Rotas configuradas corretamente
- ✅ Links usando componentes do React Router (paths relativos)

---

**Última atualização:** Configuração validada e pronta para deploy! 🚀
