# Relatório de Auditoria Forense — V-Login (PerformTrack)

**Data:** 2026-03-30
**Protocolo:** Audit Master v2.1
**Stack:** React 18.3.1, Next.js 15.3.0, Vite 6.3.5, TypeScript 5.3.3, Tailwind CSS, Supabase, Capacitor (Android)

---

## 1. Sumario Executivo

### Nota Geral: 5.1 / 10

Projecto com stack moderna e boa infraestrutura CI/CD, mas com lacunas significativas em acessibilidade, qualidade de codigo (ficheiros muito grandes, ratio de testes baixo), e documentacao de governanca. A seguranca esta razoavel com headers bem configurados mas autenticacao mock insegura em uso. Compliance LGPD/GDPR bem implementado com policy, export e eliminacao de conta.

### Principais Riscos

1. **Autenticacao por tokens Base64 sem assinatura criptografica** — tokens forjaveis por qualquer utilizador (HIGH)
2. **localStorage para dados sensiveis** — vulneravel a XSS, permitindo roubo de sessao (HIGH)
3. **Ratio de testes < 7%** — 16 ficheiros de teste para 250+ ficheiros de codigo; risco alto de regressoes (HIGH)

### Top 3 Recomendacoes

1. Substituir tokens Base64 por JWT com assinatura (esforco: 1-2 dias)
2. Migrar dados sensiveis de localStorage para cookies HttpOnly secure (esforco: 2-3 dias)
3. Aumentar cobertura de testes para pelo menos 30%, focando hooks e API routes (esforco: 2-3 semanas)

### Top 10 Achados Criticos

| # | ID | Severidade | Categoria | Descricao | Ficheiro |
|---|---|---|---|---|---|
| 1 | SEC-001 | HIGH | Seguranca | Tokens Base64 sem assinatura — forjaveis | `app/api/athlete-portal/auth/route.ts:118` |
| 2 | SEC-002 | HIGH | Seguranca | localStorage para tokens e dados de sessao | `contexts/AppContext.tsx:225` |
| 3 | SEC-003 | HIGH | Seguranca | Comparacao de cron secret vulneravel a timing attack | `api/cron/sync-athlete-metrics/route.ts:34` |
| 4 | SEC-004 | MEDIUM | Seguranca | Passwords em plain text (mock auth) | `contexts/AppContext.tsx:324` |
| 5 | SEC-005 | MEDIUM | Seguranca | RLS parcialmente implementado — nao funciona sem auth real | `database/migrations/008_notifications_system.sql:229` |
| 6 | COD-001 | HIGH | Qualidade | Ficheiro use-api.ts com 1636 linhas — mega-hook monolitico | `hooks/use-api.ts:1` |
| 7 | COD-002 | MEDIUM | Qualidade | 37+ usos de `: any` e `as any` | `hooks/use-api.ts` (multiplas linhas) |
| 8 | A11-001 | MEDIUM | Acessibilidade | Sem prefers-reduced-motion em nenhuma animacao | Global |
| 9 | A11-002 | MEDIUM | Acessibilidade | Sem focus trap em modais e drawers | `components/ui/Modal.tsx` |
| 10 | DOC-001 | MEDIUM | Documentacao | README raiz com apenas 3 linhas | `README.md` |

### Quick Wins

| # | ID | Categoria | Descricao | Esforco | Impacto |
|---|---|---|---|---|---|
| 1 | QW-001 | Seguranca | Usar `crypto.timingSafeEqual()` na verificacao do CRON_SECRET | 15min | Alto |
| 2 | QW-002 | Qualidade | Remover console.log/warn/error restantes do codigo fonte | 30min | Medio |
| 3 | QW-003 | Qualidade | Resolver o TODO pendente em useSubmissions | 15min | Baixo |
| 4 | QW-004 | Acessibilidade | Adicionar aria-label a botoes com icone apenas | 1h | Alto |
| 5 | QW-005 | Acessibilidade | Adicionar skip-nav link no layout principal | 30min | Medio |
| 6 | QW-006 | Performance | Adicionar `font-display: swap` nos web fonts | 15min | Medio |
| 7 | QW-007 | Performance | Desactivar source maps em producao (`build.sourcemap: false`) | 5min | Medio |
| 8 | QW-008 | Documentacao | Criar CHANGELOG.md | 1h | Medio |
| 9 | QW-009 | Documentacao | Criar CONTRIBUTING.md | 1h | Medio |
| 10 | QW-010 | Compliance | Remover `console.log('Creating injury:', data)` em HealthTab.tsx | 5min | Alto |

---

## 2. Dashboard de Severidade

| Severidade | Seguranca | Codigo | A11y | Perf | Infra | Compliance | Total |
|---|---|---|---|---|---|---|---|
| CRITICAL | 0 | 0 | 0 | 0 | 0 | 0 | **0** |
| HIGH | 3 | 1 | 0 | 0 | 0 | 0 | **4** |
| MEDIUM | 2 | 3 | 4 | 2 | 0 | 1 | **12** |
| LOW | 1 | 2 | 2 | 1 | 0 | 0 | **6** |
| INFO | 0 | 1 | 0 | 0 | 0 | 0 | **1** |

**Total (apos deduplicacao):** 23 | **Filtrados (testes/scripts):** 4

---

## 3. Reconhecimento

### 3.1 Stack

| Componente | Tecnologia | Versao |
|---|---|---|
| Framework | React + Next.js | 18.3.1 / 15.3.0 |
| Bundler | Vite | 6.3.5 |
| Linguagem | TypeScript | 5.3.3 |
| CSS | Tailwind CSS | via tailwind-merge 2.6.0 |
| UI Components | Radix UI | 30+ componentes |
| Backend/BaaS | Supabase | 2.49.4 |
| State/Data | SWR | 2.3.3 |
| Forms | React Hook Form | 7.55.0 |
| Charts | Recharts | 2.15.2 |
| Animations | Motion | 11.18.2 |
| Error Tracking | Sentry | 9.0.0 / 10.46.0 |
| Analytics | PostHog | 1.364.1 |
| Mobile | Capacitor | 8.0.2 |
| Logging | Pino | 10.3.1 |
| Deploy | Vercel | — |
| Testing | Playwright + Jest + k6 | 1.51.1 |

### 3.2 Metricas

| Metrica | Valor |
|---|---|
| Ficheiros de codigo | 250+ |
| Linhas de codigo (estimado) | ~40.000+ |
| Componentes (.tsx/.jsx) | 150+ |
| Custom Hooks | 41+ |
| Ficheiros de teste | 16 |
| Racio teste/codigo | ~6.4% |
| Type definitions | 15+ ficheiros |
| API Routes | 20+ endpoints |
| Migracoes SQL | 16 ficheiros |

### 3.3 Top 15 Maiores Ficheiros

| # | Ficheiro | Linhas |
|---|---|---|
| 1 | `hooks/use-api.ts` | 1636 |
| 2 | `lib/mockDataSprint0.ts` | 1362 |
| 3 | `App.tsx` | 871 |
| 4 | `types/metrics.ts` | 807 |
| 5 | `hooks/useFormSubmission.ts` | 782 |
| 6 | `pages/CalendarDemoPage.tsx` | 770 |
| 7 | `lib/SubmissionProcessor.ts` | 693 |
| 8 | `lib/decision-engine/rules.ts` | 669 |
| 9 | `lib/decision-engine/evaluator.ts` | 658 |
| 10 | `lib/scheduling-engine.ts` | 643 |
| 11 | `components/live/LiveCommandContext.tsx` | 613 |
| 12 | `components/dataos/wizard/WizardAdvancedFeatures.tsx` | 592 |
| 13 | `components/live/LiveSession.tsx` | 577 |
| 14 | `lib/exportHandlers.ts` | 570 |
| 15 | `lib/pdfExport.ts` | 566 |

---

## 4. Seguranca

### Sumario

| Tipo | Contagem |
|---|---|
| Hardcoded secrets | 0 (movidos para .env) |
| Code injection (eval) | 0 (safe evaluator) |
| XSS vectors | 1 (dangerouslySetInnerHTML — sanitizado) |
| SQL injection | 0 (Supabase SDK parametrizado) |
| Armazenamento inseguro | 6+ ficheiros com localStorage |
| CORS misconfiguration | 0 |
| Headers de seguranca | Configurados (vercel.json + vite) |
| Deps vulneraveis | Nao verificado (sem npm audit) |

### Achados

#### [SEC-001] Tokens Base64 sem Assinatura Criptografica
- **Severidade:** HIGH
- **Categoria:** Seguranca > Autenticacao
- **Ficheiro:** `src/app/api/athlete-portal/auth/route.ts` — Linha 118-124
- **Evidencia:**
```typescript
const token = Buffer.from(
  JSON.stringify({ athleteId, workspaceId, timestamp })
).toString('base64');
```
- **Impacto:** Qualquer utilizador pode decodificar e forjar tokens de acesso, impersonando outros atletas/workspaces. Acesso nao autorizado a dados de saude/performance.
- **Remediacao:**
```typescript
import jwt from 'jsonwebtoken';
const token = jwt.sign({ athleteId, workspaceId }, process.env.JWT_SECRET, { expiresIn: '24h' });
```
- **Esforco:** 1 dia

#### [SEC-002] Dados Sensiveis em localStorage
- **Severidade:** HIGH
- **Categoria:** Seguranca > Armazenamento
- **Ficheiro:** `src/contexts/AppContext.tsx` — Linhas 225-226, 335-336, 368-369, 408-409
- **Evidencia:**
```typescript
localStorage.setItem('performtrack_user', JSON.stringify(userWithoutPassword));
localStorage.setItem('performtrack_workspace', JSON.stringify(MOCK_WORKSPACE));
```
- **Impacto:** Qualquer vulnerabilidade XSS permite acesso a todos os dados da sessao. O proprio codigo de auditoria anterior reconhece: "Sessoes guardadas em localStorage (inseguro)".
- **Remediacao:** Migrar para cookies HttpOnly com flag Secure e SameSite=Strict. Usar Supabase Auth com cookies server-side.
- **Esforco:** 2-3 dias

#### [SEC-003] Timing Attack na Verificacao de Cron Secret
- **Severidade:** HIGH
- **Categoria:** Seguranca > Autenticacao
- **Ficheiro:** `src/api/cron/sync-athlete-metrics/route.ts` — Linha 34
- **Evidencia:**
```typescript
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`)
```
- **Impacto:** Comparacao de strings em tempo variavel permite brute-force do CRON_SECRET via timing side-channel.
- **Remediacao:**
```typescript
import { timingSafeEqual } from 'crypto';
const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`);
const received = Buffer.from(authHeader);
if (expected.length !== received.length || !timingSafeEqual(expected, received)) { ... }
```
- **Esforco:** 15 minutos

#### [SEC-004] Passwords em Plain Text
- **Severidade:** MEDIUM
- **Categoria:** Seguranca > Autenticacao
- **Ficheiro:** `src/contexts/AppContext.tsx` — Linha 324
- **Evidencia:**
```typescript
if (!userData || userData.password !== password) {
  throw new Error('Invalid email or password');
}
```
- **Impacto:** Passwords armazenadas e comparadas sem hash. Mesmo para demo/mock, estabelece padroes inseguros.
- **Remediacao:** Usar bcrypt para hash e comparacao, ou migrar completamente para Supabase Auth.
- **Esforco:** 4 horas

#### [SEC-005] RLS Parcialmente Implementado
- **Severidade:** MEDIUM
- **Categoria:** Seguranca > Base de Dados
- **Ficheiro:** `src/database/migrations/008_notifications_system.sql` — Linha 229
- **Evidencia:** Migracoes mostram ENABLE ROW LEVEL SECURITY mas documentacao interna reconhece "RLS nao funciona sem auth real". Migracoes de debug (`20260218_debug_open_rls.sql`) sugerem policies abertas.
- **Impacto:** Sem isolamento real de dados entre workspaces. Dados de um treinador potencialmente acessiveis por outro.
- **Remediacao:** Implementar auth real com Supabase Auth e policies RLS baseadas em `auth.uid()`.
- **Esforco:** 1 semana

#### [SEC-006] dangerouslySetInnerHTML (Mitigado)
- **Severidade:** LOW
- **Categoria:** Seguranca > XSS
- **Ficheiro:** `src/components/ui/chart.tsx` — Linha 96-122
- **Evidencia:** Uso de dangerouslySetInnerHTML para CSS com `sanitizeCSSValue()` implementado.
- **Impacto:** Mitigado pela sanitizacao regex-based. Risco residual baixo.
- **Remediacao:** Monitorizar; considerar CSS-in-JS como alternativa.
- **Esforco:** N/A

---

## 5. Qualidade de Codigo

### Sumario

| Tipo | Contagem |
|---|---|
| `: any` / `as any` | 37+ |
| `@ts-ignore` | 0 |
| `console.log` | 355 ocorrencias / 115 ficheiros |
| TODO/FIXME | 1 |
| Empty catch | 0 |
| Ficheiros >300L | 15+ |
| High coupling (>15 imports) | 3-5 ficheiros |
| Dead code | Nao detectado (sem AST analysis) |
| Codigo duplicado | 6+ padroes |

### Achados

#### [COD-001] Mega-Hook Monolitico: use-api.ts (1636 linhas)
- **Severidade:** HIGH
- **Categoria:** Qualidade > Manutenibilidade
- **Ficheiro:** `src/hooks/use-api.ts` — 1636 linhas, 33+ hooks exportados
- **Evidencia:** Um unico ficheiro consolida todos os hooks de API: calendar, sessions, athletes, metrics, workouts, exercises, submissions, forms, etc. Contem padroes repetidos de error handling (20+ vezes) e SWR wrappers identicos.
- **Impacto:** Extremamente dificil de manter, testar e fazer code review. Qualquer alteracao num hook arrisca regressao em todos os outros.
- **Remediacao:** Dividir em ficheiros por feature: `hooks/calendar/useCalendarEvents.ts`, `hooks/athletes/useAthletes.ts`, `hooks/sessions/useSessions.ts`, etc. Extrair `useApiMutation` e `useApiQuery` como helpers reutilizaveis.
- **Esforco:** 2-3 dias

#### [COD-002] 37+ Usos de `any` Type
- **Severidade:** MEDIUM
- **Categoria:** Qualidade > Type Safety
- **Ficheiro:** `src/hooks/use-api.ts` (maioria), `components/athlete/NewAthleteProfile.tsx:47`, `components/athlete/AthleteApp.tsx:49`
- **Evidencia:**
```typescript
error: any  // interfaces
(body?: any)  // MutationResponse
} catch (err: any) {  // catch blocks (20+ vezes)
useState<any[]>([])  // componentes
```
- **Impacto:** Perda de type safety em runtime. Bugs de null/undefined nao detectados pelo compilador.
- **Remediacao:** Criar interfaces tipadas para API responses, error objects, e event handlers. Usar `unknown` em vez de `any` nos catch blocks.
- **Esforco:** 1-2 dias

#### [COD-003] 355 Console Statements em Producao
- **Severidade:** MEDIUM
- **Categoria:** Qualidade > Logs
- **Ficheiro:** 115 ficheiros com console.log/warn/error
- **Evidencia:** `console.log`, `console.warn`, `console.error` dispersos por hooks, API routes e componentes.
- **Impacto:** Poluicao do console do browser. Potencial fuga de PII em logs. Performance degradada.
- **Remediacao:** Remover todos os console statements ou substituir por Pino logger (ja presente como dependencia). Configurar `removeConsole` no build de producao.
- **Esforco:** 2 horas

#### [COD-004] Codigo Duplicado no Padrao de Mutacao
- **Severidade:** MEDIUM
- **Categoria:** Qualidade > DRY
- **Ficheiro:** `src/hooks/use-api.ts` — 20+ hooks com padrao identico
- **Evidencia:**
```typescript
// Repetido 20+ vezes:
} catch (err: any) {
  setError(err.message);
  throw err;
} finally {
  setIsLoading(false);
}
```
- **Impacto:** Manutencao multiplicada. Correccoes de bugs precisam ser replicadas em 20+ locais.
- **Remediacao:** Extrair `useApiMutation<T>()` generico que encapsula try/catch/finally, loading state e error handling.
- **Esforco:** 4 horas

#### [COD-005] Racio de Testes < 7%
- **Severidade:** LOW
- **Categoria:** Qualidade > Testes
- **Ficheiro:** `src/tests/` — 16 ficheiros de teste para 250+ ficheiros de codigo
- **Evidencia:** Unit: 6, E2E: 6, Visual: 3, Accessibility: 1, Integration: 2. Total: 18 ficheiros de teste.
- **Impacto:** Risco elevado de regressoes em refactoring. Sem rede de seguranca para alteracoes em hooks ou business logic.
- **Remediacao:** Priorizar testes para: decision-engine, scheduling-engine, hooks criticos (useFormSubmission, useAPI), e API routes.
- **Esforco:** 2-3 semanas

#### [COD-006] CalendarCore.tsx com 29 Imports
- **Severidade:** LOW
- **Categoria:** Qualidade > Coupling
- **Ficheiro:** `src/components/calendar/core/CalendarCore.tsx` — 29 imports
- **Evidencia:** Importa modais, views, providers, hooks e utilitarios num unico componente orquestrador.
- **Impacto:** Alto acoplamento; dificil de testar isoladamente.
- **Remediacao:** Extrair modais para lazy-loaded sub-componentes. Usar dynamic imports para views pesadas.
- **Esforco:** 1 dia

#### [COD-007] TODO Pendente
- **Severidade:** INFO
- **Categoria:** Qualidade > Manutencao
- **Ficheiro:** `src/hooks/use-api.ts` — Linha 1356
- **Evidencia:** `// TODO: Get from context`
- **Impacto:** workspaceId possivelmente hardcoded em vez de vir do contexto.
- **Remediacao:** Obter workspaceId do AppContext.
- **Esforco:** 15 minutos

---

## 6. Acessibilidade

### Sumario

| Tipo | Contagem |
|---|---|
| Imgs sem alt | 0 |
| Botoes sem texto/aria-label | 3+ (icon buttons) |
| Inputs sem label | Parcial (labels associados, sem aria-label) |
| Divs click sem role | 0 |
| Focus trap | Nao |
| Skip links | Nao |
| prefers-reduced-motion | Nao |
| Dark mode | Parcial (next-themes presente, tokens definidos) |

### Achados

#### [A11-001] Sem Suporte a prefers-reduced-motion
- **Severidade:** MEDIUM
- **Categoria:** Acessibilidade > Preferencias
- **Ficheiro:** Global — LoginPage.tsx, ErrorBoundary.tsx, Modal.tsx, PerformanceMonitor.tsx
- **Evidencia:** Animacoes Motion usadas extensivamente sem media query `prefers-reduced-motion`. Zero ocorrencias encontradas no CSS.
- **Impacto:** Utilizadores com epilepsia, enxaquecas ou vestibular disorders podem ter reaccoes adversas. Violacao WCAG 2.3.3 (AAA).
- **Remediacao:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```
- **Esforco:** 2 horas

#### [A11-002] Sem Focus Trap em Modais
- **Severidade:** MEDIUM
- **Categoria:** Acessibilidade > Focus Management
- **Ficheiro:** `src/components/ui/Modal.tsx`
- **Evidencia:** Modal usa `AnimatePresence` para animacao mas nao gerencia focus. Tab key pode navegar para elementos fora do modal.
- **Impacto:** Utilizadores de teclado/screen reader perdem contexto. Violacao WCAG 2.4.3 (A).
- **Remediacao:** Instalar `focus-trap-react` ou usar Radix Dialog (que ja esta nas dependencias).
- **Esforco:** 2 horas

#### [A11-003] Sem Skip Navigation Links
- **Severidade:** MEDIUM
- **Categoria:** Acessibilidade > Navegacao
- **Ficheiro:** Layout principal
- **Evidencia:** Nenhum link "Skip to main content" encontrado.
- **Impacto:** Utilizadores de teclado precisam tab por toda a navegacao. Violacao WCAG 2.4.1 (A).
- **Remediacao:** Adicionar `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` no topo do layout.
- **Esforco:** 30 minutos

#### [A11-004] Botoes Icon-Only sem aria-label
- **Severidade:** MEDIUM
- **Categoria:** Acessibilidade > Semantica
- **Ficheiro:** `src/components/pages/LoginPage.tsx:126-137`, `src/components/shared/ErrorBoundary.tsx:124-142`
- **Evidencia:** Botao de toggle password visibility e botoes de accao no ErrorBoundary nao tem aria-label.
- **Impacto:** Screen readers anunciam botao sem texto acessivel. Violacao WCAG 4.1.2 (A).
- **Remediacao:** Adicionar `aria-label="Mostrar password"` / `aria-label="Tentar novamente"`.
- **Esforco:** 30 minutos

#### [A11-005] Sem prefers-color-scheme / Dark Mode Activo
- **Severidade:** LOW
- **Categoria:** Acessibilidade > Preferencias
- **Ficheiro:** `src/styles/globals.css`
- **Evidencia:** Design tokens OKLCH definidos com variantes dark. `next-themes` presente como dependencia. Mas nenhum mecanismo de switching activo encontrado.
- **Impacto:** Utilizadores com preferencia dark mode nao beneficiam automaticamente.
- **Remediacao:** Activar ThemeProvider do next-themes e mapear tokens dark.
- **Esforco:** 4 horas

#### [A11-006] Inputs sem aria-label Explicito
- **Severidade:** LOW
- **Categoria:** Acessibilidade > Formularios
- **Ficheiro:** `src/components/pages/LoginPage.tsx:95-107`
- **Evidencia:** Inputs associados via `<label>` element mas sem `aria-label` explicito.
- **Impacto:** Baixo — labels associados sao suficientes para WCAG AA. aria-label seria um reforco.
- **Remediacao:** Verificar que todos os inputs complexos (OTP, calendarios) tem labels.
- **Esforco:** 1 hora

---

## 7. Performance

### Sumario

| Metrica | Valor | Estado |
|---|---|---|
| Bundle size | Nao medido (sem build) | — |
| Imagens >200KB | 0 | OK |
| Source maps prod | Default (activos) | Risco |
| Code splitting | Sim (14 rotas lazy) | OK |
| Lazy loading | Sim | OK |
| font-display swap | Nao | Falta |
| React.memo/useMemo/useCallback | 0 instancias | Falta |

### Achados

#### [PERF-001] Zero Memoizacao React
- **Severidade:** MEDIUM
- **Categoria:** Performance > Rendering
- **Ficheiro:** Global — 0 instancias de React.memo, useMemo ou useCallback
- **Evidencia:** Nenhum componente ou hook usa memoizacao. Com 150+ componentes e SWR data fetching, re-renders desnecessarios sao provaveis.
- **Impacto:** Componentes pesados (CalendarCore, AthleteDashboard, DataOS) re-renderizam desnecessariamente em cada update de estado.
- **Remediacao:** Adicionar `React.memo` a componentes puros de listagem. Usar `useMemo` para calculos derivados de metricas. Usar `useCallback` para handlers passados como props.
- **Esforco:** 1-2 dias

#### [PERF-002] Source Maps Provavelmente em Producao
- **Severidade:** MEDIUM
- **Categoria:** Performance > Bundle
- **Ficheiro:** `vite.config.ts`
- **Evidencia:** Sem `build: { sourcemap: false }` explicito. Vite gera source maps por defeito.
- **Impacto:** Bundle maior em producao. Codigo-fonte exposto facilitando reverse engineering.
- **Remediacao:**
```typescript
build: { sourcemap: false }
```
- **Esforco:** 5 minutos

#### [PERF-003] Sem font-display: swap
- **Severidade:** LOW
- **Categoria:** Performance > Fontes
- **Ficheiro:** `src/styles/globals.css`
- **Evidencia:** Nenhuma declaracao `font-display: swap` encontrada em CSS.
- **Impacto:** Flash of invisible text (FOIT) durante carregamento de fontes externas.
- **Remediacao:** Adicionar `font-display: swap` a todas as declaracoes `@font-face`.
- **Esforco:** 15 minutos

---

## 8. Infraestrutura

### CI/CD Checklist

| Item | Estado |
|---|---|
| Pipeline existe | GitHub Actions — 11 jobs |
| Testes | Jest (unit) + Playwright (e2e/visual) |
| Lint | ESLint + Prettier + TypeScript check |
| npm audit | npm audit + Snyk |
| Secret scan | Snyk security scan |
| Deploy auto | Vercel (preview PRs + prod main) |
| Staging | Preview deployments em PRs |

### Docker (N/A — Vercel deployment)

| Item | Estado |
|---|---|
| Multistage | N/A |
| Non-root | N/A |
| .dockerignore | N/A |

### Observabilidade

| Item | Estado |
|---|---|
| Error tracking | Sentry (client + server + edge) |
| Logs estruturados | Pino (10.3.1) |
| Health check | `GET /api/health` (DB check + version) |
| Analytics | PostHog |

### Achados

A infraestrutura CI/CD e a area mais madura do projecto. Pipeline GitHub Actions com 11 jobs cobre lint, type-check, testes (unit, e2e, visual), build, Lighthouse CI, security scan (Snyk + npm audit), deploy preview e producao, com notificacoes Slack em caso de falha.

---

## 9. Compliance (LGPD/GDPR)

### Checklist

| Requisito | Estado | Artigo |
|---|---|---|
| Politica privacidade | Sim (`PrivacyPage.tsx`) | Art.8 LGPD / Art.7 GDPR |
| Termos aceites | Sim (`TermsPage.tsx`) | — |
| Consentimento | Sim (dados saude requerem consentimento explicito) | Art.8 / Art.7 |
| Export dados | Sim (`POST /api/export` — CSV, JSON) | Art.18 / Art.20 |
| Exclusao conta | Sim (`DELETE /api/user/account` — soft-delete + anonimizacao) | Art.18 / Art.17 |
| Dados sensiveis | Sim (saude classificada como sensivel) | Art.11 / Art.9 |
| Logs sem PII | Parcial (console.log com dados de injury) | Art.32 / Art.32 |

### Achados

#### [COMP-001] PII em Console.log de Dados de Saude
- **Severidade:** MEDIUM
- **Categoria:** Compliance > LGPD Art.32
- **Ficheiro:** `src/components/athlete/profile/HealthTab.tsx` — Linha 67
- **Evidencia:**
```typescript
console.log('Creating injury:', data);
```
- **Impacto:** Dados de lesoes (categoria especial LGPD) expostos no console do browser. Em ambiente partilhado, outro utilizador pode aceder.
- **Remediacao:** Remover console.log ou substituir por logger com filtragem PII.
- **Esforco:** 5 minutos

---

## 10. Migracoes

### Sumario

| Tipo | Contagem |
|---|---|
| Total migracoes | 16 |
| Ops destrutivas | 0 detectadas |
| Sem rollback | A verificar |
| Sem transacao | A verificar |

### Achados

16 ficheiros de migracao SQL cobrindo: schema inicial, event confirmations, recurring events, calendar integration, design studio, enterprise features, forms, sessions, reports, e multiplas correccoes RLS. Padrao incremental correcto. Migracoes `20260218_debug_open_rls.sql` sugerem policies excessivamente permissivas para debug — devem ser revertidas antes de producao.

---

## 11. Arquitectura e Resiliencia

### Pontos Fortes
- **3 Error Boundaries**: shared, calendar-specific, e UI — com fallback UI, error details em dev, e mecanismo de reset
- **Safe Formula Evaluator**: `safeFormulaEvaluator.ts` usa recursive descent parser em vez de eval()
- **Decision Engine**: Modulo bem estruturado com evaluator, aggregator, rules, threshold-calculator, runner, types
- **Code Splitting**: 14 rotas lazy-loaded com Suspense boundaries

### Lacunas
- **0 AbortController/timeout** — requests sem limite temporal podem bloquear a UI
- **Retry parcial** — 43 instancias mas sem backoff exponencial padronizado
- **Sem i18n** — strings hardcoded em portugues, sem framework de traducao
- **Loading states inconsistentes** — sem padrao centralizado de gestao de estado de carregamento

---

## 12. Scorecards

| Dimensao | Score | Peso | Justificativa |
|---|---|---|---|
| Seguranca | 6.0/10 | 2.0 | Headers excelentes, CI sec scan. Penalizado por tokens Base64, localStorage e RLS parcial |
| Qualidade | 4.0/10 | 1.5 | TS strict ON, ESLint/Prettier. Penalizado por any (37+), testes <7%, ficheiros gigantes, 355 console.log |
| Acessibilidade | 3.0/10 | 1.0 | Sem imgs sem alt, sem divs click. Penalizado por falta de reduced-motion, focus trap, skip nav |
| Performance | 4.0/10 | 1.0 | Code splitting excelente (14 rotas). Penalizado por 0 memoizacao, source maps, sem font-swap |
| Infraestrutura | 8.0/10 | 1.0 | Pipeline CI/CD exemplar (11 jobs), Sentry, Pino, PostHog, health check, deploy auto |
| Compliance | 5.0/10 | 1.5 | LGPD/GDPR implementado (policy, export, delete). Penalizado por PII em logs |
| Resiliencia | 6.0/10 | 1.0 | 3 Error Boundaries, retry parcial, Sentry. Sem timeout/AbortController |
| Documentacao | 3.0/10 | 0.5 | README raiz minimo (3 linhas). Sem CHANGELOG, CONTRIBUTING, ARCHITECTURE. 993 JSDoc e boa compensacao |
| **GLOBAL** | **5.1/10** | | Media ponderada |

### Maturidade

| Dimensao | Nivel Actual | Alvo (3 meses) |
|---|---|---|
| Seguranca | 3 - Definido | 4 - Gerido |
| Qualidade | 2 - Repetivel | 3 - Definido |
| Acessibilidade | 2 - Repetivel | 3 - Definido |
| Performance | 2 - Repetivel | 3 - Definido |
| DevOps | 4 - Gerido | 4 - Gerido |
| Compliance | 3 - Definido | 4 - Gerido |

---

## 13. Consolidacao Estrategica (C4)

### Matriz Valor x Esforco

| Quadrante | Achados |
|---|---|
| Quick Wins (alto valor, baixo esforco) | SEC-003, QW-001 a QW-010, A11-003, A11-004, PERF-002, PERF-003 |
| Projectos (alto valor, alto esforco) | SEC-001, SEC-002, SEC-005, COD-001, COD-005 |
| Divida Controlada (baixo valor, baixo esforco) | COD-003, A11-005, A11-006, COD-006 |
| Reavaliar (baixo valor, alto esforco) | i18n framework (nao prioritario sem necessidade multi-idioma) |

### Plano 5 Fases

#### Fase 1: Preparacao (Semana 1)
- [ ] SEC-003: Implementar `crypto.timingSafeEqual()` nos cron jobs
- [ ] COMP-001: Remover console.log com PII de dados de saude
- [ ] PERF-002: Desactivar source maps em producao
- [ ] A11-003: Adicionar skip navigation link
- [ ] A11-004: Adicionar aria-labels a botoes icon-only

#### Fase 2: Estabilizacao (Semana 2-3)
- [ ] SEC-001: Substituir tokens Base64 por JWT assinados
- [ ] SEC-002: Migrar localStorage para cookies HttpOnly
- [ ] SEC-004: Implementar bcrypt ou migrar para Supabase Auth completo
- [ ] COD-003: Remover/substituir console statements por Pino logger

#### Fase 3: Refatoracao (Semana 4-6)
- [ ] COD-001: Dividir use-api.ts em hooks por feature
- [ ] COD-002: Eliminar usos de `any` type
- [ ] COD-004: Extrair helpers `useApiMutation` e `useApiQuery`
- [ ] COD-006: Reduzir coupling em CalendarCore.tsx

#### Fase 4: Resiliencia (Semana 7-8)
- [ ] COD-005: Aumentar cobertura de testes para 30%+
- [ ] Implementar AbortController/timeout em API calls
- [ ] Padronizar retry com backoff exponencial
- [ ] A11-001: Implementar prefers-reduced-motion
- [ ] A11-002: Adicionar focus trap a modais

#### Fase 5: Optimizacao (Semana 9-12)
- [ ] PERF-001: Adicionar React.memo/useMemo/useCallback
- [ ] SEC-005: Implementar RLS real com Supabase Auth
- [ ] A11-005: Activar dark mode com next-themes
- [ ] Criar ARCHITECTURE.md, CONTRIBUTING.md, CHANGELOG.md
- [ ] Expandir README raiz

### OKRs

| OKR | Baseline | Target | Prazo |
|---|---|---|---|
| Vulns HIGH+ | 4 | 0 | 3 sem |
| Cobertura testes | ~7% | 30%+ | 8 sem |
| Score seguranca | 6.0/10 | 8.0+/10 | 4 sem |
| Score a11y | 3.0/10 | 6.0+/10 | 8 sem |
| Score global | 5.1/10 | 7.0+/10 | 12 sem |

---

## 14. Recomendacoes Estrategicas

### Curto Prazo (1-2 semanas)
1. Corrigir timing attack (SEC-003) — 15 minutos, impacto maximo
2. Remover PII de logs (COMP-001) — 5 minutos, compliance
3. Implementar JWT em vez de Base64 tokens (SEC-001)
4. Desactivar source maps em producao (PERF-002)
5. Adicionar skip-nav e aria-labels (A11-003, A11-004)

### Medio Prazo (1-3 meses)
1. Migrar de localStorage para cookies HttpOnly (SEC-002)
2. Dividir use-api.ts e eliminar any types (COD-001, COD-002)
3. Aumentar cobertura de testes para 30%+ (COD-005)
4. Implementar reduced-motion e focus trap (A11-001, A11-002)
5. Criar documentacao de governanca (ARCHITECTURE, CONTRIBUTING, CHANGELOG)

### Longo Prazo (3-12 meses)
1. Implementar RLS completo com Supabase Auth (SEC-005)
2. Atingir cobertura de testes 60%+
3. Implementar i18n se necessario para expansao
4. Atingir WCAG AA completo
5. Considerar Server Components do Next.js para melhor performance

---

## 15. Anexos

### A. Tecnologias Analisadas
React 18.3.1, Next.js 15.3.0, Vite 6.3.5, TypeScript 5.3.3, Supabase 2.49.4, Sentry 9.0.0/10.46.0, PostHog 1.364.1, Pino 10.3.1, Playwright 1.51.1, Jest, k6, Radix UI (30+ componentes), Motion 11.18.2, React Hook Form 7.55.0, SWR 2.3.3, Recharts 2.15.2, Capacitor 8.0.2.

### B. Sumario por Categoria
- Seguranca: 6 achados (0 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW)
- Qualidade: 7 achados (0 CRITICAL, 1 HIGH, 3 MEDIUM, 2 LOW, 1 INFO)
- Acessibilidade: 6 achados (0 CRITICAL, 0 HIGH, 4 MEDIUM, 2 LOW)
- Performance: 3 achados (0 CRITICAL, 0 HIGH, 2 MEDIUM, 1 LOW)
- Compliance: 1 achado (0 CRITICAL, 0 HIGH, 1 MEDIUM, 0 LOW)
- Infra: 0 achados (pipeline exemplar)
- Documentacao: 1 achado (0 CRITICAL, 0 HIGH, 1 MEDIUM, 0 LOW)

### C. Ficheiros Analisados
250+ ficheiros de codigo TypeScript/TSX, 16 ficheiros de teste, 16 migracoes SQL, 70+ ficheiros de documentacao MD, ficheiros de configuracao (vite, tsconfig, playwright, jest, lighthouse, sentry, vercel, capacitor, dependabot, CI workflow).

### D. Notas e Limitacoes
- npm audit nao foi executado (ambiente sem shell POSIX completo)
- Bundle size nao medido (sem build artifacts)
- Analise estatica apenas; nao foi executado runtime ou penetration testing
- Contagens de `any` e console.log sao estimativas baseadas em grep

---
*Audit Master Protocol v2.1 — Gerado em 2026-03-30*
