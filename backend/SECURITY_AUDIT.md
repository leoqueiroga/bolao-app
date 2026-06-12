# 🔐 Audit de Segurança — Bolão App

**Data:** 03/06/2026  
**Escopo:** Backend (NestJS) + Frontend (Vue/Vite) + Infraestrutura (Supabase/PM2/Netlify)

---

## Resumo Executivo

A aplicação apresenta uma **base de segurança sólida** (Helmet, CORS restritivo, rate limiting, RLS no Supabase, validação de DTOs, exception filter). Porém, existem **vulnerabilidades de média e baixa severidade** que merecem atenção.

| Severidade | Quantidade |
|-----------|-----------|
| 🔴 Alta   | 2         |
| 🟠 Média  | 5         |
| 🟡 Baixa  | 6         |

---

## 🔴 Severidade Alta

### 1. Campo `prediction` sem validação de schema (Injection via JSONB)

**Arquivo:** `src/bets/dto/bet.dto.ts`  
**Problema:** O campo `prediction` é tipado como `any` sem nenhuma validação de estrutura:

```typescript
@IsNotEmpty()
prediction: any; // PERIGO: aceita qualquer JSON
```

**Risco:** Um atacante pode enviar payloads JSON enormes (DoS), com nested objects profundos, ou dados inesperados que podem causar erros na avaliação de apostas. Apesar do Supabase sanitizar SQL injection em JSONB, o fato de aceitar qualquer estrutura é perigoso.

**Correção:**
```typescript
import { IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExactScorePrediction {
  @IsNumber()
  @Min(0)
  @Max(99)
  home_score: number;

  @IsNumber()
  @Min(0)
  @Max(99)
  away_score: number;
}

class ResultPrediction {
  @IsEnum(['home_win', 'draw', 'away_win'])
  result: string;
}

// Alternativa mínima: validar tamanho e profundidade
@IsObject()
@MaxDepth(2) // custom validator
prediction: ExactScorePrediction | ResultPrediction;
```

---

### 2. Execução como `root` em produção

**Arquivo:** `ecosystem.config.js`  
**Problema:** `cwd: '/root/bolao-app/backend'` — o processo PM2 roda como root.

**Risco:** Se houver qualquer RCE (Remote Code Execution), o atacante terá acesso total ao servidor.

**Correção:**
```bash
# Criar usuário dedicado
sudo useradd -m -s /bin/bash bolao-app
sudo chown -R bolao-app:bolao-app /home/bolao-app/bolao-app

# Atualizar ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bolao-backend',
    script: 'dist/main.js',
    cwd: '/home/bolao-app/bolao-app/backend',
    user: 'bolao-app', // ← rodar como usuário sem privilégios
    // ...
  }]
}
```

---

## 🟠 Severidade Média

### 3. IDs de entidade sem validação UUID em `CreateBetDto`

**Arquivo:** `src/bets/dto/bet.dto.ts`  
**Problema:**

```typescript
@IsString()  // deveria ser @IsUUID()
@IsNotEmpty()
game_id: string;

@IsString()  // deveria ser @IsUUID()
@IsNotEmpty()
bet_type_id: string;
```

**Risco:** Permite envio de strings arbitrárias que serão usadas em queries ao Supabase. Embora o Supabase use queries parametrizadas, isso pode causar erros inesperados ou bypass de lógica.

**Correção:**
```typescript
@IsUUID()
@IsNotEmpty()
game_id: string;

@IsUUID()
@IsNotEmpty()
bet_type_id: string;
```

---

### 4. Endpoint expõe apostas de todos os usuários sem controle de acesso

**Arquivo:** `src/bets/bets.controller.ts`  
**Problema:** O endpoint `GET /bets/game/:gameId/all` retorna apostas de TODOS os usuários sem restrição de role:

```typescript
@Get('game/:gameId/all')
async findAllByGame(@Param('gameId', UUIDValidationPipe) gameId: string) {
  return this.betsService.findAllByGame(gameId);
}
```

**Risco:** Qualquer usuário autenticado pode ver as apostas de todos os outros, incluindo nome e avatar. Em um bolão, isso pode influenciar decisões de aposta.

**Correção:** Restringir a admin ou só mostrar após o jogo começar:
```typescript
@Get('game/:gameId/all')
async findAllByGame(
  @Param('gameId', UUIDValidationPipe) gameId: string,
  @CurrentUser() user: any,
) {
  return this.betsService.findAllByGame(gameId, user); // verificar se jogo já começou
}
```

---

### 5. Ranking controller sem validação de UUID nos parâmetros

**Arquivo:** `src/ranking/ranking.controller.ts`  
**Problema:** Parâmetros `userId` e `competitionId` não usam `UUIDValidationPipe`:

```typescript
@Get('user/:userId')
async getUserHistoryById(@Param('userId') userId: string) { ... }

@Get('user/:userId/bets')
async getUserBetsDetails(@Param('userId') userId: string) { ... }

@Get('competition/:competitionId')
async getRankingByCompetition(@Param('competitionId') competitionId: string) { ... }
```

**Correção:** Adicionar `UUIDValidationPipe` a todos os `@Param()`.

---

### 6. CSP do frontend permite `'unsafe-inline'` e `'unsafe-eval'` para scripts

**Arquivo:** `frontend/netlify.toml`  
```
script-src 'self' 'unsafe-inline' 'unsafe-eval';
```

**Risco:** Anula a proteção de CSP contra XSS. Um atacante que consiga injetar HTML pode executar JavaScript arbitrário.

**Correção:** Usar nonces ou hashes em vez de `'unsafe-inline'`. Se a framework exigir inline, pelo menos remover `'unsafe-eval'`:
```
script-src 'self' 'unsafe-inline';
```

---

### 7. Parâmetros de query não validados no Games Controller

**Arquivo:** `src/games/games.controller.ts`  
**Problema:** Os query params `competition_id` e `status` são passados diretamente sem validação:

```typescript
@Get()
async findAll(
  @Query('competition_id') competitionId?: string,
  @Query('status') status?: string,
) { ... }
```

**Risco:** Valores inesperados para `status` podem causar queries ineficientes ou erros.

**Correção:** Criar um DTO com validação:
```typescript
class FindGamesQueryDto {
  @IsUUID()
  @IsOptional()
  competition_id?: string;

  @IsEnum(['scheduled', 'in_progress', 'finished', 'postponed', 'cancelled'])
  @IsOptional()
  status?: string;
}
```

---

## 🟡 Severidade Baixa

### 8. CORS bloqueia requests sem `Origin` em produção

**Arquivo:** `src/main.ts`  
**Observação:** ~~Requests de ferramentas CLI, healthchecks internos, ou server-to-server serão bloqueados em produção.~~ Este comportamento é **intencional e correto** — bloquear requests sem `Origin` em produção é uma defesa legítima contra CSRF e automação não autorizada. Garantir apenas que healthchecks internos (como do PM2 ou load balancer) usem um mecanismo alternativo (endpoint interno sem passar pelo CORS, ou fazer chamada com header `Origin` explícito).

---

### 9. Deploy script sem verificação de integridade

**Arquivo:** `deploy.sh`  
**Problema:** Não há verificação de testes antes do deploy, nem rollback automático.

**Sugestão:**
```bash
echo "==> Rodando testes..."
npm test || { echo "FALHA NOS TESTES - deploy cancelado"; exit 1; }
```

---

### 10. Logs com dados sensíveis em desenvolvimento

**Arquivo:** `src/common/filters/http-exception.filter.ts`  
**Problema:** ~~Em desenvolvimento, o erro completo é logado com `console.error('Exception:', { error: exception })`. Se o request body contiver senha, ela pode aparecer nos logs.~~ **Análise corrigida:** o filtro loga `exception` (o objeto de erro), não o `request.body`. O body com senha não está exposto. O risco real e menor é que stacktraces com contextos de erro do Supabase ocasionalmente incluem dados do input nos ambientes de dev. Baixíssimo impacto real.

**Sugestão (opcional):** Sanitizar campos sensíveis do objeto exception antes de logar, por cautela.

---

### 11. Sem limite de tamanho de payload (body-parser)

**Problema:** O NestJS/Express usa o default de 100kb para JSON body, o que é razoável. Porém, não há limite explícito configurado — se o default mudar ou se alguém adicionar `multer`, pode abrir DoS.

**Sugestão:** Configurar explicitamente em `main.ts`:
```typescript
app.use(express.json({ limit: '100kb' }));
```

---

### 12. Token de refresh sem validação de formato

**Arquivo:** `src/auth/auth.controller.ts`  
**Problema:** O `refresh_token` é extraído do body sem nenhuma validação:

```typescript
@Post('refresh')
async refresh(@Body('refresh_token') refreshToken: string) { ... }
```

**Sugestão:** Criar um DTO com validação:
```typescript
class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000) // tokens não devem ser gigantescos
  refresh_token: string;
}
```

---

### 13. Sem proteção contra account enumeration

**Arquivo:** `src/auth/auth.service.ts`  
**Observação:** As mensagens de erro do Supabase no login podem diferenciar "user not found" vs "wrong password". O exception filter em produção retorna apenas "Unauthorized", o que é bom. Verificar se o Supabase não retorna mensagens distintas.

---

## ✅ Pontos Positivos

| Aspecto | Implementação |
|---------|--------------|
| Rate Limiting | ✅ Global (100/min) + específico em auth (5 registro, 10 login) |
| Helmet | ✅ HSTS, noSniff, CSP, referrerPolicy |
| CORS | ✅ Restritivo com whitelist de origins |
| Validação de Input | ✅ Global ValidationPipe com whitelist + forbidNonWhitelisted |
| Sanitização de Erros | ✅ Exception filter esconde detalhes em produção |
| RLS (Row Level Security) | ✅ Habilitado em todas as tabelas com policies adequadas |
| Autenticação | ✅ JWT com Supabase, guard global, verificação de user no banco |
| Autorização | ✅ Role-based access control para operações admin |
| UUID Validation | ✅ Pipe custom para parâmetros de rota (parcial — faltam alguns) |
| Validação de Env | ✅ Falha no startup se variáveis obrigatórias não existem |
| Secrets no Git | ✅ .env no .gitignore |
| Soft Delete | ✅ Games usa `deleted_at` em vez de delete real |
| Senha | ✅ Min 8 chars, maiúscula + minúscula + número |
| Race Condition | ✅ Flags `isRunning` no scheduler previnem execuções paralelas |

---

## 📋 Plano de Ação Prioritário

| # | Ação | Esforço | Impacto |
|---|------|---------|---------|
| 1 | Validar schema de `prediction` nos DTOs | Médio | Alto |
| 2 | Mover app para usuário sem privilégios | Baixo | Alto |
| 3 | Adicionar `@IsUUID()` em `CreateBetDto` | Baixo | Médio |
| 4 | Restringir endpoint `/bets/game/:id/all` | Baixo | Médio |
| 5 | Adicionar UUID validation no ranking controller | Baixo | Médio |
| 6 | Remover `unsafe-eval` do CSP | Baixo | Médio |
| 7 | Validar query params do games controller | Baixo | Baixo |
| 8 | Criar DTO para refresh token | Baixo | Baixo |

---

*Audit realizado via análise estática de código. Recomenda-se complementar com testes de penetração e dependency audit (`npm audit`).*
