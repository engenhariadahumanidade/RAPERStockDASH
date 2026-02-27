# Renomear Projeto: RAPERStockDASH

Este plano descreve os passos para renomear o projeto de `teste` para `RAPERStockDASH` localmente e no GitHub.

## 📌 Visão Geral
- **Objetivo**: Alterar todas as referências ao nome antigo `teste` para o novo nome `RAPERStockDASH`.
- **Tipo de Projeto**: WEB (Next.js)

## 🎯 Critérios de Sucesso
- `package.json` reflete o novo nome.
- Títulos e metadados estão consistentes.
- README.md atualizado.
- Remote do Git apontando para o novo repositório (após renomeação no GitHub).

## 🛠️ Tech Stack
- Node.js / NPM
- Git / GitHub CLI

## 📂 Alterações de Arquivos
- `./package.json`
- `./README.md`
- `./src/app/layout.tsx` (Verificação de consistência)

## 📋 Breakdown de Tarefas

### Fase 1: Análise e Preparação
- [x] Mapear ocorrências de `teste`. (Finalizado)
- [ ] Validar se o usuário deseja renomear a pasta física.

### Fase 2: Configuração Local (PHASE 4 - AGENT: `frontend-specialist`)
- [ ] Atualizar `"name"` em `package.json`.
- [ ] Atualizar `README.md` com o novo título e descrição.
- [ ] Rodar `npm install` para atualizar o `package-lock.json`.

### Fase 3: Git & GitHub (PHASE 4 - AGENT: `devops-engineer`)
- [ ] Verificar conexão com GitHub.
- [ ] Renomear o repositório remotamente (usando `gh repo rename` ou instruções manuais).
- [ ] Atualizar a URL do remote local: `git remote set-url origin ...`.

## ✅ PHASE X: Verificação Final
- [ ] `npm run lint` passa sem erros.
- [ ] `git remote -v` mostra o novo nome.
- [ ] Aplicação inicia normalmente com `npm run dev`.

---
**Nota**: Não renomearemos a pasta física automaticamente para evitar quebra de sessão.
