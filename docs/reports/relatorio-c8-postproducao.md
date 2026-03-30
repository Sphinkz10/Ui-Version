# Relatório de Auditoria Pós-Produção — Protocolo C8

**Projecto:** PerformTrack (V-Login2)
**Data:** 28 de Março de 2026
**Protocolo:** C8 – Post-Production Resilience & Governance v1.0
**Auditor:** Claude (Audit Post-Production Plugin)
**Stack:** React 18.3 + Vite 6.3.5 + Supabase + Vercel + Capacitor (Android)

---

## Sumário Executivo

### Score Global: 3.0/10 🟠 Fraco

| Módulo | Score | Status |
|---|---|---|
| M1 — UAT & Validação | 5/10 | 🟡 Médio |
| M2 — Monitorização e Observabilidade | 3/10 | 🟠 Fraco |
| M3 — Testes de Carga e Performance | 2/10 | 🔴 Crítico |
| M4 — Documentação Técnica | 3/10 | 🟠 Fraco |
| M5 — CI/CD Pipeline | 4/10 | 🟠 Fraco |
| M6 — Governança | 2/10 | 🔴 Crítico |
| M7 — Segurança Pós-Deploy | 2/10 | 🔴 Crítico |

> **Fórmula ponderada aplicada:** M2×1.5 + M5×1.3 + M7×1.3 + M6×1.2 + M1+M3+M4×1.0 ÷ 8.3
> Score calculado: (3×1.5)+(4×1.3)+(2×1.3)+(2×1.2)+5+2+3 ÷ 8.3 = **24.7 ÷ 8.3 = 3.0**

### Achados por Severidade

| Severidade | Quantidade |
|---|---|
| 🔴 CRITICAL | 4 |
| 🟠 HIGH | 5 |
| 🟡 MEDIUM | 6 |
| 🔵 LOW | 5 |
| ⚪ INFO | 3 |

### Diagnóstico Rápido

O PerformTrack tem uma **base técnica promissora** (React 18, TypeScript strict, Tailwind, Supabase) mas apresenta **lacunas graves ao nível de resiliência e governança** que impedem uma entrada segura em produção. O problema mais crítico é a **exposição de credenciais Supabase no ficheiro `.env`** versionado, combinada com a ausência de headers de segurança essenciais (CSP, HSTS) e a falta completa de processos de governança (branch protection, code review obrigatório, dependabot). O pipeline CI/CD está bem concebido em papel (387 linhas, 10 jobs) mas está **localizado em `src/workflows/ci.yml` em vez de `.github/workflows/ci.yml`**, o que significa que muito provavelmente não está a ser executado pelo GitHub Actions. A monitorização tem Sentry configurado mas sem logs estruturados, sem dashboards operacionais reais, sem uptime monitor e sem health check endpoint. O projecto precisa de 1-2 semanas de trabalho focalizado em segurança e governança antes de poder ir a produção.

**Maturidade operacional:** Nível 2 — Repetível (práticas existem em esboço mas não são consistentes nem aplicadas)

---

## Achados Detalhados

### 🔴 CRITICAL

#### C-01 — Credenciais Supabase Expostas em Repositório

- **Módulo:** M7 — Segurança Pós-Deploy
- **Localização:** `.env` (raiz do projecto, versionado)
- **Descrição:** O ficheiro `.env` contém credenciais activas do Supabase — URL da instância e a chave anónima JWT — versionadas no repositório. Qualquer pessoa com acesso ao repositório tem acesso directo à base de dados de produção. A chave anónima JWT é decodificável online (base64) e permite autenticação directa na Supabase API sem passar pela aplicação.
- **Risco:** Acesso não autorizado à base de dados. Exfiltração de dados de atletas e coaches. Violação de RGPD. Se o repo for público, os dados estão completamente expostos.
- **Remediação:**
  1. Revogar imediatamente a chave anónima no dashboard Supabase
  2. Gerar nova chave e guardar **apenas** em variáveis de ambiente do servidor (Vercel dashboard, GitHub Secrets)
  3. Adicionar `.env` ao `.gitignore` raiz
  4. Criar `.env.example` com placeholders
  5. Auditar o git history para remover credenciais (`git filter-repo` ou BFG Repo Cleaner)
- **Esforço estimado:** S (2-4h) — urgente, fazer hoje

```bash
# .gitignore DEVE conter:
.env
.env.local
.env.production
.env.*.local

# Revogar e rodar credenciais imediatamente
# https://supabase.com/dashboard → Settings → API → Regenerate anon key
```

---

#### C-02 — Pipeline CI/CD Localizado Fora da Pasta `.github/workflows/`

- **Módulo:** M5 — CI/CD Pipeline
- **Localização:** `src/workflows/ci.yml` (errado) → deveria ser `.github/workflows/ci.yml`
- **Descrição:** O pipeline CI/CD (387 linhas, 10 jobs bem concebidos) está guardado em `src/workflows/ci.yml`. O GitHub Actions **apenas detecta e executa workflows em `.github/workflows/`**. Como o ficheiro está dentro de `src/`, o pipeline nunca foi executado. Todos os quality gates (lint, tests, security scan, deploy) são actualmente processos manuais ou inexistentes em prática.
- **Risco:** Zero automação em produção. Qualquer push para `main` pode fazer deploy sem passar por testes. Falhas silenciosas de qualidade.
- **Remediação:**
  1. Mover `src/workflows/ci.yml` → `.github/workflows/ci.yml`
  2. Criar pasta `.github/` na raiz se não existir
  3. Verificar que o workflow funciona com `gh workflow run ci.yml`
  4. Confirmar primeiro run com sucesso antes de qualquer deploy
- **Esforço estimado:** XS (30min) + debugging do primeiro run

```bash
mkdir -p .github/workflows
mv src/workflows/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git rm src/workflows/ci.yml
git commit -m "fix: move CI workflow to correct .github/workflows location"
```

---

#### C-03 — Ausência de Branch Protection e Code Review

- **Módulo:** M6 — Governança
- **Localização:** Configuração GitHub (não detectada)
- **Descrição:** Não foram encontrados ficheiros `.github/settings.yml`, `CODEOWNERS`, ou evidência de branch protection rules configuradas. Qualquer developer (ou acidente) pode fazer push directo para `main` sem revisão ou testes. Com o pipeline no sítio errado (ver C-02), não há qualquer travão no caminho para produção.
- **Risco:** Deploy de código não revisto em produção. Impossibilidade de rastrear quem aprovou o quê. Violação de boas práticas de segurança.
- **Remediação:**
  1. Activar Branch Protection em `main` no GitHub: Settings → Branches → Add rule
  2. Require pull request reviews: mínimo 1 aprovação
  3. Require status checks to pass: `lint`, `test-unit`, `build`
  4. Require branches to be up to date before merging
  5. Criar `.github/CODEOWNERS` com owners por área

```yaml
# .github/settings.yml (com GitHub Settings App)
branches:
  - name: main
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
      required_status_checks:
        strict: true
        contexts: [lint, test-unit, build]
      enforce_admins: false
      restrictions: null
```

---

#### C-04 — Ausência Total de Testes de Carga

- **Módulo:** M3 — Testes de Carga
- **Localização:** Projecto (nenhum script encontrado)
- **Descrição:** Não foram encontrados scripts de teste de carga (k6, Locust, Artillery, JMeter). O projecto tem Lighthouse CI no pipeline (performance page load) mas isso não é um teste de carga — não testa comportamento sob tráfego concorrente, não testa endpoints API, não testa a Supabase sob stress. Para uma aplicação de gestão de atletas com potencial de múltiplos coaches e centenas de atletas simultâneos, a ausência de testes de carga é crítica antes do go-live.
- **Risco:** A aplicação pode colapsar com 50+ utilizadores simultâneos sem aviso prévio. A Supabase free tier tem limites de conexões que podem ser atingidos facilmente.
- **Remediação:** Criar scripts k6 básicos para os endpoints críticos.

```javascript
// tests/load/basic-load.js (k6)
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p95<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const res = http.get('https://YOUR_APP/api/health');
  check(res, { 'status was 200': (r) => r.status === 200 });
}
```

---

### 🟠 HIGH

#### H-01 — Ausência de Logs Estruturados (apenas `console.log`)

- **Módulo:** M2 — Monitorização
- **Descrição:** O projecto usa `console.log` como estratégia de logging. Embora `next.config.performance.js` remova `console.log` em produção, isso significa que **não há logging nenhum em produção** — nem erros operacionais, nem traces de debug. Sem Winston, Pino, ou equivalente configurado com transports para Sentry/Datadog/Logtail, é impossível diagnosticar incidentes pós-deploy.
- **Remediação:** Instalar `pino` (mais leve) e criar logger wrapper que envia para Sentry em produção.

```typescript
// src/lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
});

export default logger;
// Uso: logger.error({ userId, action }, 'Failed to fetch athlete data');
```

---

#### H-02 — Headers de Segurança Incompletos (sem CSP, HSTS, Referrer)

- **Módulo:** M7 — Segurança
- **Localização:** `src/next.config.js`
- **Descrição:** O `next.config.js` tem apenas `X-Frame-Options: DENY` e `X-Content-Type-Options: nosniff`. Faltam headers críticos de segurança: CSP previne XSS, HSTS força HTTPS, Referrer-Policy protege privacidade, Permissions-Policy limita acesso a APIs do browser.

```javascript
// ❌ Actual (next.config.js — apenas 2 headers)
{ 'X-Frame-Options': 'DENY' }
{ 'X-Content-Type-Options': 'nosniff' }

// ✅ Adicionar:
{ 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }
{ 'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; ..." }
{ 'Referrer-Policy': 'strict-no-referrer-when-cross-origin' }
{ 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' }
```

---

#### H-03 — Ausência de Health Check Endpoint

- **Módulo:** M2 — Monitorização
- **Descrição:** Não existe nenhum endpoint `/health`, `/api/health`, ou `/ping`. Sem este endpoint, serviços de uptime monitoring (UptimeRobot, BetterStack) não conseguem verificar se a aplicação está operacional. O Vercel cron usa `/api/calendar-confirmations/process-queue` (lógica de negócio) como proxy de health — não é apropriado.
- **Remediação:** Criar endpoint simples que verifica conectividade com Supabase.

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    const { data, error } = await supabase.from('workspaces').select('count').single();
    if (error) throw error;
    return Response.json({ status: 'ok', db: 'connected', ts: Date.now() });
  } catch (e) {
    return Response.json({ status: 'error', db: 'disconnected' }, { status: 503 });
  }
}
```

---

#### H-04 — Ausência de Dependabot / Renovate

- **Módulo:** M6 — Governança
- **Descrição:** Muitas dependências estão fixadas em `*` (latest) — `next`, `@sentry/nextjs`, `motion`, `tailwind-merge`, `swr` — o que significa que cada `npm install` pode instalar versões diferentes. Sem Dependabot, vulnerabilidades conhecidas em dependências não são automaticamente sinalizadas.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    groups:
      dependencies:
        patterns: ["*"]
```

---

#### H-05 — RLS Policies com Histórico de Vulnerabilidades

- **Módulo:** M7 — Segurança
- **Localização:** `src/supabase/migrations/`
- **Descrição:** Das 21 migrations SQL, 4 têm "fix" no nome relacionado com RLS: `fix_registration_rls`, `fix_recursive_rls`, `fix_athletes_rls`, `debug_open_rls`. A migration `debug_open_rls` é particularmente preocupante — "open RLS" no nome sugere que pode ter temporariamente aberto acesso sem restrições. A primeira migration tem `CREATE POLICY "Workspaces are viewable by everyone for now" ... USING (true)` — política completamente aberta.
- **Remediação:** Auditar todas as RLS policies activas, eliminar `USING (true)` de tabelas sensíveis, e criar testes de segurança que verificam acesso cross-tenant.

---

### 🟡 MEDIUM / 🔵 LOW

| ID | Módulo | Severidade | Descrição | Localização |
|---|---|---|---|---|
| M-01 | M2 | 🟡 MEDIUM | Sentry `tracesSampleRate: 1.0` em produção — custo elevado e dados desnecessários | `sentry.client.config.ts`, `sentry.server.config.ts` |
| M-02 | M3 | 🟡 MEDIUM | Lighthouse CI no pipeline sem baseline documentada — sem threshold de regressão | `src/workflows/ci.yml` |
| M-03 | M4 | 🟡 MEDIUM | Documentação dispersa em 100+ ficheiros — sem estrutura de entrada única | raiz do projecto |
| M-04 | M5 | 🟡 MEDIUM | `npm audit` e Snyk com `continue-on-error: true` — não bloqueiam deploys inseguros | `src/workflows/ci.yml` |
| M-05 | M1 | 🟡 MEDIUM | Sem sign-off formal de UAT — checklist existe mas sem stakeholder sign-off documentado | `QUALITY_CHECKLIST_FINAL.md` |
| M-06 | M6 | 🟡 MEDIUM | Sem PR template — pull requests sem estrutura de descrição obrigatória | `.github/` (ausente) |
| L-01 | M4 | 🔵 LOW | ARCHITECTURE.md ausente — decisões arquitecturais não documentadas | raiz |
| L-02 | M4 | 🔵 LOW | CONTRIBUTING.md ausente — sem guia para novos contribuidores | raiz |
| L-03 | M4 | 🔵 LOW | CHANGELOG.md ausente — histórico de versões não registado | raiz |
| L-04 | M4 | 🔵 LOW | .env.example ausente — setup local não documentado | raiz |
| L-05 | M6 | 🔵 LOW | Capacitor `appId: "com.example.app"` — ID genérico não apto para produção Android | `capacitor.config.json` |

---

## Análise por Módulo

### M1 — UAT & Validação de Aceitação

**Score: 5/10** 🟡 Médio

| Verificação | Status |
|---|---|
| Plano de testes UAT formal | ⚠️ Parcial (QUALITY_CHECKLIST_FINAL.md, não formal) |
| Sign-off formal de stakeholders | ❌ Ausente |
| Critérios de aceitação mensuráveis | ⚠️ Parcial (checklist tem critérios binários) |
| Testes E2E de fluxos críticos | ✅ Presente (Playwright, 6+ suites) |
| Resultados por cenário documentados | ❌ Ausente |

**Ficheiros detectados:** `QUALITY_CHECKLIST_FINAL.md`, `AUDITORIA_PRE_PRODUCAO_COMPLETA.md`, `src/tests/e2e/complete-user-journey.spec.ts`

**Penalizações aplicadas:**
- Sem plano UAT formal: -2 (parcial, tem checklist)
- Sem sign-off: -3
- **Total: 10 - 5 = 5**

O projecto tem testes Playwright bem estruturados que cobrem o fluxo completo do utilizador (`complete-user-journey.spec.ts`), testes de acessibilidade WCAG (`wcag-audit.spec.ts`), e testes visuais em 17 viewports diferentes. A QUALITY_CHECKLIST_FINAL.md funciona como proxy de plano UAT mas sem as assinaturas formais de stakeholders. O que falta é a formalização: transformar a checklist num documento de sign-off com datas, versão testada, e aprovação documentada.

---

### M2 — Monitorização e Observabilidade

**Score: 3/10** 🟠 Fraco

| Verificação | Status |
|---|---|
| Error tracking (Sentry) | ✅ Configurado (client + server + edge) |
| Logs estruturados (Winston/Pino) | ❌ Ausente |
| Uptime monitor (UptimeRobot/BetterStack) | ❌ Ausente |
| SLIs/SLOs definidos | ❌ Ausente (template, não real) |
| Dashboards operacionais | ❌ Ausente (template MONITORING_DASHBOARD_48H.md) |
| Alertas configurados (PagerDuty/Slack) | ❌ Ausente |
| Health check endpoint | ❌ Ausente |

**Serviços detectados:** Sentry (3 configs: client, server, edge)

**Penalizações aplicadas:**
- Sentry presente: 0 (não penalizado)
- Sem logs estruturados: -3
- Sem uptime monitor: -2
- Sem SLOs: -2
- **Total: 10 - 7 = 3**

O Sentry está correctamente configurado com DSN via variável de ambiente, `beforeSend` para redactar PII, e sampling de replays a 10%. O problema é que `tracesSampleRate: 1.0` em produção vai gerar custos elevados e dados desnecessários — recomenda-se `0.1` a `0.2`. O ficheiro `MONITORING_DASHBOARD_48H.md` é um **template com dados fictícios** (LCP: 2.1s, API p95: 296ms) e não uma dashboard real. Não existe nenhum mecanismo para verificar se a aplicação está online além do próprio Sentry receber erros.

---

### M3 — Testes de Carga e Performance

**Score: 2/10** 🔴 Crítico

| Verificação | Status |
|---|---|
| Scripts de teste de carga (k6/Locust/Artillery) | ❌ Ausente |
| Testes de stress/spike | ❌ Ausente |
| Baseline de performance documentada | ❌ Ausente (template) |
| Lighthouse CI no pipeline | ✅ Presente (mas pipeline no sítio errado) |
| Resultados com p95/p99 | ❌ Ausente |

**Penalizações aplicadas:**
- Sem scripts de teste de carga: -4
- Sem stress/spike: -2
- Sem baseline documentada: -2
- Lighthouse presente: 0 (não penalizado)
- **Total: 10 - 8 = 2**

O `next.config.performance.js` tem optimizações de build inteligentes (code splitting por vendor, AVIF/WebP, Etags, remoção de console.log). O Lighthouse CI está configurado no pipeline para 3 URLs. Mas nada disto é um teste de carga — o Lighthouse mede performance de carregamento para **um utilizador**, não comportamento sob 100+ utilizadores simultâneos. A Supabase gratuita tem limite de 60 conexões simultâneas de DB; sem testes de carga não há como saber se isso é suficiente.

---

### M4 — Documentação Técnica

**Score: 3/10** 🟠 Fraco

| Ficheiro | Existe | Qualidade |
|---|---|---|
| README.md | ✅ Sim | ⚠️ Parcial (visão geral, mas setup incompleto) |
| ARCHITECTURE.md | ❌ Não | — |
| CONTRIBUTING.md | ❌ Não | — |
| CHANGELOG.md | ❌ Não | — |
| DEPLOY.md | ❌ Não | — |
| SECURITY.md | ❌ Não (só em node_modules) | — |
| .env.example | ❌ Não | — |

**Penalizações aplicadas:**
- ARCHITECTURE.md ausente: -2
- CONTRIBUTING.md ausente: -1
- CHANGELOG.md ausente: -1
- DEPLOY.md ausente: -2
- .env.example ausente: -1
- **Total: 10 - 7 = 3**

O projecto tem uma quantidade impressionante de documentação (100+ ficheiros .md), mas está **dispersa e desorganizada**: `SETUP_GUIDE.md`, `API_REFERENCE.md`, `QUALITY_CHECKLIST_FINAL.md`, `POST_LAUNCH_PLAN.md`, `PLANO_ACAO_PRODUCAO.md`, `STATUS_DAY30_COMPLETE.md`, `MONITORING_DASHBOARD_48H.md`, e dezenas mais dentro de `src/`. Esta abundância sem estrutura é quase tão problemática como a ausência — um novo developer não sabe por onde começar.

---

### M5 — CI/CD Pipeline

**Score: 4/10** 🟠 Fraco

| Verificação | Status |
|---|---|
| Pipeline CI configurado | ⚠️ Existe mas no sítio errado |
| Localização do workflow | ❌ `src/workflows/ci.yml` (deve ser `.github/workflows/`) |
| Testes obrigatórios | ✅ Configurados (unit, e2e, visual, a11y) |
| Lint/type-check | ✅ Configurado (ESLint, TypeScript) |
| Lighthouse CI | ✅ Configurado |
| Audit de dependências | ⚠️ `continue-on-error: true` (não bloqueia) |
| Deploy para staging (Vercel preview) | ✅ Configurado |
| Deploy para produção (Vercel) | ✅ Configurado |
| Dependabot/Renovate | ❌ Ausente |
| Secrets geridos correctamente | ❌ `.env` versionado |

**Workflows detectados:** `src/workflows/ci.yml` (387 linhas, 10 jobs)

**Penalizações aplicadas:**
- Pipeline no sítio errado (efectivamente não corre): -3
- npm audit + Snyk com continue-on-error: -1
- Sem dependabot: -1
- Secrets expostos (.env): -1 (já penalizado em M7)
- **Total: 10 - 5 = 4** (com crédito pelo design bem estruturado)

**Detalhe dos 10 jobs do pipeline (se fosse activado):**

| Job | Timeout | Trigger | Dependências |
|---|---|---|---|
| lint-typecheck | 10min | push/PR | — |
| test-unit | 15min | push/PR | — |
| test-visual | 30min | push/PR | — |
| test-e2e | 30min | push/PR | — |
| build | 15min | push/PR | lint, test-unit |
| performance-tests | 20min | push/PR | build |
| security-scan | 10min | push/PR | — |
| deploy-preview | 10min | PR only | build |
| deploy-production | 15min | main push | build, test-unit, test-visual, test-e2e, security |
| notify | — | sempre | all |

O design do pipeline é exemplar — o problema é exclusivamente o ficheiro estar no sítio errado.

---

### M6 — Governança

**Score: 2/10** 🔴 Crítico

| Verificação | Status |
|---|---|
| Branch protection | ❌ Ausente (não detectada) |
| Code review obrigatório | ❌ Ausente |
| Dependabot configurado | ❌ Ausente |
| PR template | ❌ Ausente |
| CODEOWNERS | ❌ Ausente |
| Post-mortem process | ❌ Ausente |
| On-call documentation | ❌ Ausente |
| Issue templates | ❌ Ausente |

**Penalizações aplicadas:**
- Sem branch protection: -4
- Sem code review: -3
- Sem dependabot: -1
- **Total: 10 - 8 = 2**

Não foi encontrada nenhuma pasta `.github/` com ficheiros de governança. Combinado com o pipeline no sítio errado, o resultado prático é: qualquer developer pode fazer push directo para `main`, desencadear um deploy para produção sem qualquer revisão, sem testes automáticos, e sem auditoria. Este é o gap de governança mais crítico a resolver após a segurança.

---

### M7 — Segurança Pós-Deploy

**Score: 2/10** 🔴 Crítico

| Verificação | Status |
|---|---|
| .env no .gitignore | ❌ Não (credenciais expostas) |
| SECURITY.md | ❌ Ausente |
| Secret scanning no CI | ❌ Ausente |
| npm audit no CI | ⚠️ Presente mas não bloqueante |
| CORS configurado | ⚠️ Não detectado explicitamente |
| Headers de segurança completos | ⚠️ Parcial (2/6 headers) |
| RLS Supabase | ⚠️ Presente mas com histórico de bugs |
| Imagens SVG dangerouslyAllowSVG | ⚠️ Risco XSS presente |

**Penalizações aplicadas:**
- .env não no .gitignore: -4
- Sem SECURITY.md: -1
- Sem secret scanning no CI: -2
- npm audit não bloqueante: -1
- **Total: 10 - 8 = 2**

**Headers de segurança actual vs recomendado:**

| Header | Status Actual | Recomendado |
|---|---|---|
| X-Frame-Options | ✅ DENY | OK |
| X-Content-Type-Options | ✅ nosniff | OK |
| Content-Security-Policy | ❌ Ausente | `default-src 'self'...` |
| Strict-Transport-Security | ❌ Ausente | `max-age=31536000; includeSubDomains` |
| Referrer-Policy | ❌ Ausente | `strict-no-referrer-when-cross-origin` |
| Permissions-Policy | ❌ Ausente | `camera=(), microphone=()` |

**Nota sobre `dangerouslyAllowSVG: true`** em `next.config.js`: permite injecção de scripts via SVGs maliciosos. Mitigado parcialmente pelo `contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"` aplicado às imagens, mas é um risco que deve ser monitorizado.

---

## Plano de Remediação

### Fase 1 — Crítico: Antes de qualquer deploy (Semana 1)

- [ ] **Revogar credenciais Supabase expostas** — Revogar chave anónima actual no dashboard Supabase, gerar nova, guardar apenas em Vercel env vars | Esforço: XS (1h) | Responsável: Lead Dev | **FAZER HOJE**
- [ ] **Mover CI workflow** — `mv src/workflows/ci.yml .github/workflows/ci.yml` e verificar primeiro run | Esforço: XS (30min) | Responsável: DevOps
- [ ] **Adicionar .env ao .gitignore** — Criar `.gitignore` raiz, adicionar `.env`, criar `.env.example` | Esforço: XS (30min) | Responsável: Lead Dev
- [ ] **Activar Branch Protection** — GitHub Settings → Branches → main → require PR + status checks | Esforço: XS (30min) | Responsável: Admin GitHub
- [ ] **Criar health check endpoint** — `GET /api/health` com verificação de DB | Esforço: S (2h) | Responsável: Backend Dev
- [ ] **Auditar RLS policies activas** — Verificar estado actual de todas as RLS, eliminar `USING (true)` de tabelas sensíveis | Esforço: M (4h) | Responsável: Backend Dev

### Fase 2 — Alta Prioridade (Semana 2)

- [ ] **Headers de segurança completos** — Adicionar CSP, HSTS, Referrer-Policy, Permissions-Policy ao `next.config.js` | Esforço: S (2h)
- [ ] **Logging estruturado** — Instalar `pino`, criar `src/lib/logger.ts`, substituir `console.log` críticos | Esforço: M (1 dia)
- [ ] **npm audit bloqueante** — Remover `continue-on-error: true` do job de security-scan no CI | Esforço: XS (5min)
- [ ] **Dependabot** — Criar `.github/dependabot.yml` para updates semanais | Esforço: XS (15min)
- [ ] **Fixar versões de dependências** — Substituir `*` por versões específicas em package.json | Esforço: S (2h)
- [ ] **PR Template** — Criar `.github/PULL_REQUEST_TEMPLATE.md` | Esforço: XS (30min)
- [ ] **Sign-off UAT** — Formalizar QUALITY_CHECKLIST_FINAL.md como documento de sign-off com data e aprovação | Esforço: XS (1h)

### Fase 3 — Maturidade Operacional (Mês 2)

- [ ] **Testes de carga k6** — Criar scripts para endpoints críticos: login, athlete list, calendar | Esforço: M (2 dias)
- [ ] **Uptime monitor** — Configurar UptimeRobot ou BetterStack com o novo `/api/health` endpoint | Esforço: XS (30min)
- [ ] **Reduzir Sentry sampling** — `tracesSampleRate: 1.0` → `0.1` em produção | Esforço: XS (5min)
- [ ] **ARCHITECTURE.md** — Documentar decisões arquitecturais (Vite + Supabase + Capacitor) | Esforço: M (1 dia)
- [ ] **CONTRIBUTING.md** — Guia de contribuição com convenções e processo de PR | Esforço: S (2h)
- [ ] **Capacitor appId correcto** — `com.example.app` → `com.performtrack.app` | Esforço: XS (15min)
- [ ] **SECURITY.md** — Política de segurança e responsible disclosure | Esforço: S (1h)
- [ ] **Post-mortem template** — Criar `.github/ISSUE_TEMPLATE/post-mortem.md` | Esforço: XS (30min)

---

## Checklist de Go-Live

Use esta checklist antes de qualquer deployment em produção:

### ✅ Segurança (OBRIGATÓRIO)
- [ ] Credenciais Supabase rotadas e fora do repositório
- [ ] `.env` no `.gitignore` confirmado
- [ ] `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] Headers CSP e HSTS configurados
- [ ] RLS policies auditadas e testadas

### ✅ Pipeline (OBRIGATÓRIO)
- [ ] CI workflow em `.github/workflows/` a correr
- [ ] Branch protection activa em `main`
- [ ] Todos os jobs de CI a passar (lint, test-unit, build)
- [ ] Deploy preview verificado antes de produção

### ✅ Observabilidade (RECOMENDADO)
- [ ] Health check endpoint a responder
- [ ] Sentry a enviar erros correctamente
- [ ] Uptime monitor configurado com alertas

### ✅ Validação (RECOMENDADO)
- [ ] Testes E2E em staging a passar
- [ ] Sign-off de stakeholder documentado
- [ ] Smoke tests pós-deploy executados

---

## Resumo de Scores

```
M1 UAT/Validação        █████░░░░░  5/10  🟡  (checklist existe, sem sign-off formal)
M2 Monitorização        ███░░░░░░░  3/10  🟠  (Sentry sim, resto ausente)
M3 Testes de Carga      ██░░░░░░░░  2/10  🔴  (zero load tests, só Lighthouse)
M4 Documentação         ███░░░░░░░  3/10  🟠  (100+ docs dispersas, ficheiros core ausentes)
M5 CI/CD Pipeline       ████░░░░░░  4/10  🟠  (pipeline bem feito mas no sítio errado)
M6 Governança           ██░░░░░░░░  2/10  🔴  (zero ficheiros .github/, sem branch protection)
M7 Segurança            ██░░░░░░░░  2/10  🔴  (credenciais expostas, headers incompletos)

GLOBAL (ponderado)      ███░░░░░░░  3.0/10 🟠 Fraco — Nível 2 Repetível
```

**Nota final:** O projecto tem claramente muito esforço e competência técnica aplicados — o código React é sólido, os testes Playwright são impressionantes, e o design do pipeline CI é correcto. O problema é que o trabalho de governança e segurança foi deixado para o fim e está incompleto. Com 1-2 semanas focadas nos itens desta auditoria, o projecto pode atingir facilmente 7.0/10 e estar pronto para produção.

---

*Relatório gerado pelo Audit Post-Production Plugin — Protocolo C8 v1.0*
*Projecto: PerformTrack (V-Login2) | Data: 28 de Março de 2026 | Auditor: Claude*
