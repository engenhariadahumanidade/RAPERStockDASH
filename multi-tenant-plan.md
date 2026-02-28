# Plano de Arquitetura: Multi-Tenant RAPERStockDASH 👥

## Objetivo
Transformar o sistema de um modelo "Global" (onde todos veem a mesma carteira de ativos e compartilham as mesmas configurações) para um modelo **Multi-Tenant (Múltiplos Inquilinos)**, onde cada usuário possui seu próprio ambiente isolado, incluindo controle de envio de notificações no WhatsApp.

---

## Fase 1: Análise de Requisitos (✅ Concluído)
- **Notificações Individuais**: Cada usuário poderá cadastrar seu número de WhatsApp/Webhook, e o sistema de alertas (`Cron`) precisará avaliar as configurações de todos os usuários ativamente.
- **Isolamento de Carteira**: Cada usuário tem sua tabela `Stock` privada. Apenas ele enxergará seus ativos no painel.
- **Motor de Oportunidades**: Oportunidades de tendência seguem o escaneamento do mercado geral, mas cada dashboard puxará os lucros/prejuízos da carteira daquele `userId` logado.
- **Risco de Migração de Dados**: Não há! Foi autorizado o reset do Banco de Dados (`Stock`, `Settings`, `SystemLog`), simplificando imensamente a arquitetura.

---

## Fase 2: Solução e Arquitetura do Banco de Dados

Precisamos introduzir uma chave estrangeira de `userId` referenciando nosso modelo Clerk `User` para garantir que tudo pertença ao usuário correto.

### Novo Schema a ser desenhado:
```prisma
model Stock {
  id           Int      @id @default(autoincrement())
  symbol       String
  quantity     Float    @default(0)
  averagePrice Float    @default(0)
  userId       String   // Relacionamento com o usuário logado
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // Removido o @unique do symbol isoladamente. Agora a unicidade é [userId, symbol]
  @@unique([userId, symbol]) 
}

model Settings {
  id            Int      @id @default(autoincrement())
  userId        String   @unique // Um settings por conta
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... campos restantes (webhookUrl, phoneNumber, customMessage, etc)
}

model SystemLog {
  id        Int      @id @default(autoincrement())
  userId    String   // Para mostrar apenas os logs de cada um no Dashboard
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  // ... campos restantes
}

// O model User recebe os arrays: stocks Stock[], settings Settings?, logs SystemLog[]
```

---

## Fase 3: Planejamento de Execução (Checklist)

### Passo 1: Prisma Schema & Reset
- [ ] Atualizar o `prisma/schema.prisma` com o vinculo `User` -> `Stock`, `Settings`, `SystemLog`.
- [ ] Resetar banco e rodar as migrações (`npx prisma migrate reset`).

### Passo 2: Inicialização de Perfis (Onboarding Invisível)
- [ ] Modificar o `api/auth/me/route.ts` ou criar um gatilho de login para instanciar automaticamente as `Settings` default assim que o usuário logar pela primeira vez no painel.

### Passo 3: Refatoração das Rotas da API (REST)
- [ ] `api/stocks/route.ts`: Buscar e Salvar ações vinculando ao `userId` na sessão Clerk.
- [ ] `api/settings/route.ts`: Buscar e Atualizar configurações vinculando ao `userId`.
- [ ] `api/dashboard/route.ts`: Enviar informações do Dashboard atreladas à carteira, configs do usuário e salvar logs no `userId` dele.

### Passo 4: O "Big Brain" - Motor de Alertas (Cron Job) 🧠
- [ ] O `api/cron/route.ts` atualmente roda *apenas uma vez*. Precisará ser alterado para puxar **TODOS** os usuários que têm `autoAlerts = true`, rodar a varredura da carteira de *cada um* separadamente no loop, e mandar a mensagem no `webhookUrl` configurado por aquele `userId`.

---

## Fase 4: Implementação

Aguardando autorização para iniciar o Código pelo Passo 1.
