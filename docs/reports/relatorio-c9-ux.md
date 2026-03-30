# Relatório de Auditoria UX Pro — Protocolo C9

**Projecto:** PerformTrack (V-Login2)
**Data:** 28 de Março de 2026
**Protocolo:** C9 – UX & Onboarding Audit Pro v2.0
**Auditor:** Claude (Audit UX Pro Plugin)
**Stack:** React 18.3 + TypeScript + Tailwind CSS 4.1 + Motion + Radix UI + Sonner

---

## Sumário Executivo

### Score Global: 6.6/10 🟡 Médio

| Módulo | Score | Prioridade | Status |
|---|---|---|---|
| M1 — UX Walkthrough & First-Time Experience | 10/10 | 🔵 LOW | 🟢 Excelente |
| M2 — Onboarding | 9/10 | 🔵 LOW | 🟢 Excelente |
| M3 — Arquitectura de Informação | 5/10 | 🟡 MEDIUM | 🟡 Médio |
| M4 — Mecanismos de Feedback | 2/10 | 🔴 HIGH | 🔴 Crítico |
| M5 — Consistência Visual | 5/10 | 🟡 MEDIUM | 🟡 Médio |
| M6 — Acessibilidade | 7/10 | 🟡 MEDIUM | 🟢 Bom |
| M7 — Microcopy | 9/10 | 🔵 LOW | 🟢 Excelente |
| M8 — Loading States & Performance Percepcionada | 4/10 | 🔴 HIGH | 🟠 Fraco |

> **Fórmula ponderada:** M6×1.5 + M1×1.3 + M7×1.2 + M2+M3+M4+M5+M8×1.0 ÷ 9.0
> Score calculado: (7×1.5)+(10×1.3)+(9×1.2)+9+5+2+5+4 ÷ 9 = 59.3 ÷ 9 = **6.6**

### Achados por Prioridade

| Prioridade | Quantidade |
|---|---|
| 🔴 HIGH | 4 |
| 🟡 MEDIUM | 5 |
| 🔵 LOW | 6 |

### Diagnóstico Rápido

O PerformTrack tem **uma das melhores implementações de UX de walkthrough** que é possível encontrar numa aplicação desta fase — loading states com skeleton animados em 4 variantes, empty states com ações primária e secundária mais dicas contextuais, error boundaries a dois níveis (calendário e global), e um fluxo de registo em 3 passos com indicador de progresso. O microcopy é exemplar: 100% em PT-PT, claro, com validações accionáveis e sem erros técnicos expostos. O onboarding é sofisticado (diferenciação coach vs atleta com wizard específico por role). **O problema é que as camadas de feedback, performance e navegação não acompanham a qualidade do walkthrough.** Não existe analytics de produto (zero eventos rastreados), não existe feedback in-app, não há lazy loading das 50+ páginas (bundle monolítico), não há breadcrumbs, não há 404. A acessibilidade está melhor do que parece à primeira vista — Radix UI e axe-playwright estão presentes — mas faltam aria-labels em ícones interactivos e o Sentry (que existe no package.json) está comentado no código, tornando impossível rastrear erros em produção.

---

## Achados Detalhados

### 🔴 HIGH PRIORITY

#### HU-01 — Ausência Total de Analytics de Produto

- **Módulo:** M4 — Mecanismos de Feedback
- **Impacto no utilizador:** Indirecto mas crítico — sem dados, impossível saber o que funciona e o que não funciona. Não é possível tomar decisões de produto baseadas em evidência.
- **Evidência:** `package.json` — nenhum pacote de analytics encontrado (sem `posthog-js`, `mixpanel-browser`, `@amplitude/analytics-browser`, `gtag`). Sentry está no package.json (`@sentry/nextjs: "*"`) mas completamente comentado no código.
- **Remediação:** Integrar PostHog (open-source, RGPD-friendly, self-hostable) ou Mixpanel. Iniciar com tracking dos 5 eventos críticos: `user_signed_up`, `athlete_created`, `session_scheduled`, `form_sent`, `login`.

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

posthog.init(process.env.VITE_POSTHOG_KEY!, {
  api_host: 'https://eu.posthog.com',
  opt_in_site_apps: true,
});

export const trackEvent = (event: string, props?: Record<string, unknown>) => {
  posthog.capture(event, props);
};

// Em App.tsx
trackEvent('athlete_created', { sport: data.sport, workspace: currentWorkspace?.id });
```

- **Biblioteca sugerida:** `posthog-js` (open-source, RGPD, EU servers)

---

#### HU-02 — Ausência de Lazy Loading — Bundle Monolítico

- **Módulo:** M8 — Loading States & Performance Percepcionada
- **Impacto no utilizador:** Tempo até interacção (TTI) elevado porque todo o código de 120+ componentes e 50+ páginas é descarregado na primeira visita, mesmo que o utilizador só precise do Login e Dashboard.
- **Evidência:** `src/App.tsx` — 50+ imports estáticos no topo do ficheiro incluindo `Phase5Summary`, `DataOS`, `DesignStudio`, `AutomationHub`, `LiveCommand` — pages que a maioria dos utilizadores raramente usa.

```typescript
// ❌ Actual — todos os imports estáticos
import { Dashboard } from "./components/pages/Dashboard";
import { Athletes } from "./components/pages/Athletes";
import { Phase5Summary } from "./components/pages/Phase5Summary";
import { DataOS } from "./components/pages/DataOS";
import { DesignStudio } from "./components/pages/DesignStudio";
// ... 40+ mais
```

- **Remediação:** Converter pages para lazy imports com Suspense.

```typescript
// ✅ Recomendado
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import("./components/pages/Dashboard"));
const Athletes = lazy(() => import("./components/pages/Athletes"));
const DataOS = lazy(() => import("./components/pages/DataOS")); // carrega só se necessário
const DesignStudio = lazy(() => import("./components/pages/DesignStudio")); // carrega só se necessário

// Na render function:
<Suspense fallback={<LoadingState variant="default" />}>
  {currentPage === "home" && <Dashboard {...props} />}
  {currentPage === "athletes" && <Athletes {...props} />}
</Suspense>
```

- **Biblioteca sugerida:** Built-in React (`React.lazy`, `Suspense`)

---

#### HU-03 — Sentry Comentado — Zero Error Tracking em Produção

- **Módulo:** M4 — Mecanismos de Feedback
- **Impacto no utilizador:** Erros em produção passam despercebidos. Utilizadores encontram bugs que a equipa de desenvolvimento nunca saberá que existem.
- **Evidência:** `src/components/calendar/ErrorBoundary.tsx:118-121`

```typescript
// ❌ Sentry COMENTADO no CalendarErrorBoundary
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('Calendar Error Boundary caught an error:', error, errorInfo);

  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: errorInfo });
  // }  ← NUNCA EXECUTA
}
```

- **Remediação:** Descomentar e configurar o Sentry correctamente via `@sentry/react` (não `@sentry/nextjs` — o projecto usa Vite, não Next.js).

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  enabled: import.meta.env.PROD,
});
```

```typescript
// ErrorBoundary.tsx — descommentar e actualizar
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
}
```

- **Biblioteca sugerida:** `@sentry/react` (substituir `@sentry/nextjs`)

---

#### HU-04 — Ausência de Feedback In-App

- **Módulo:** M4 — Mecanismos de Feedback
- **Impacto no utilizador:** Utilizadores sem canal directo para reportar problemas ou partilhar sugestões. Sem voz do utilizador, o produto evolui às cegas.
- **Evidência:** Nenhum componente `FeedbackButton`, `FeedbackModal`, ou integração Crisp/Intercom/Zendesk encontrada.
- **Remediação:** Implementar um widget de feedback minimalista (2h de trabalho).

```tsx
// src/components/shared/FeedbackWidget.tsx
export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'bug' | 'idea' | 'other'>('idea');

  return (
    <>
      {/* Botão flutuante — fora do FAB para não conflituar */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Enviar feedback"
        className="fixed bottom-20 left-4 lg:bottom-4 lg:left-4 z-40 h-10 px-3 rounded-full
                   bg-white border border-slate-200 shadow-md text-xs font-medium text-slate-600
                   hover:border-sky-300 hover:text-sky-600 transition-all flex items-center gap-1.5"
      >
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        Feedback
      </button>
      {/* Modal com formulário simples */}
    </>
  );
}
```

- **Biblioteca sugerida:** Componente custom ou `crisp-sdk-web` (plano gratuito)

---

### 🟡 MEDIUM PRIORITY

#### MU-01 — Sem Breadcrumbs em Páginas de Detalhe

- **Módulo:** M3 — Arquitectura de Informação
- **Impacto:** Utilizadores perdem o contexto de onde estão quando navegam para perfis de atletas, histórico de formulários, ou vistas de detalhe. Não sabem como voltar sem o botão Back do browser.
- **Remediação:** Criar componente `Breadcrumbs.tsx` (o ficheiro foi mencionado mas não existe). Integrar em `AthleteProfile`, `FormSubmissionsHistory`, `SessionDetail`.

```tsx
// src/components/layout/Breadcrumbs.tsx
interface BreadcrumbItem { label: string; page?: Page; }
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Caminho de navegação" className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" aria-hidden="true" />}
          {item.page ? (
            <button onClick={() => setCurrentPage(item.page!)} className="hover:text-sky-600 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className="text-slate-900 font-medium" aria-current="page">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
// Uso: <Breadcrumbs items={[{label:'Atletas', page:'athletes'}, {label:'João Silva'}]} />
```

---

#### MU-02 — Página 404 Inexistente

- **Módulo:** M3 — Arquitectura de Informação
- **Impacto:** URLs inválidas ou links quebrados apresentam ecrã branco ou redirecciona para login sem explicação.
- **Remediação:** Criar `NotFound.tsx` simples com link de retorno.

```tsx
// src/components/pages/NotFound.tsx
export function NotFound({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="text-8xl font-black text-slate-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Página não encontrada</h1>
        <p className="text-slate-500 mb-6">Esta página não existe ou foi movida.</p>
        <button onClick={onNavigateHome} className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold">
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
```

---

#### MU-03 — Storybook Ausente (Design System sem Documentação Visual)

- **Módulo:** M5 — Consistência Visual
- **Impacto:** Componentes bem construídos (`EmptyState`, `StatCard`, `HelpTooltip`, `WizardProgress`) sem documentação interactiva. Novos developers não têm como explorar componentes sem mergulhar no código.
- **Remediação:** Instalar Storybook e criar stories para os 8-10 componentes partilhados essenciais.

```bash
npx storybook@latest init
# Criar stories para: Card, StatCard, EmptyState, Modal, HelpTooltip, InfoBadge, WizardProgress
```

---

#### MU-04 — `aria-current="page"` Ausente na Navegação

- **Módulo:** M6 — Acessibilidade
- **Impacto:** Screen readers não anunciam qual é o item de navegação activo. Utilizadores com leitores de ecrã não sabem em que secção estão.
- **Evidência:** `src/App.tsx` — navItems sem `aria-current`

```tsx
// ❌ Actual
<motion.button
  onClick={() => setCurrentPage(item.id)}
  className={`... ${isActive ? 'bg-sky-500 text-white' : 'text-slate-700'}`}
>
  <Icon className="h-5 w-5" />
  <span>{item.label}</span>
</motion.button>

// ✅ Recomendado
<motion.button
  onClick={() => setCurrentPage(item.id)}
  aria-current={isActive ? "page" : undefined}
  aria-label={`${item.label}${isActive ? ' (página actual)' : ''}`}
  className={`...`}
>
  <Icon className="h-5 w-5" aria-hidden="true" />
  <span>{item.label}</span>
</motion.button>
```

---

#### MU-05 — Spinners sem Anúncio para Screen Readers

- **Módulo:** M6 — Acessibilidade / M8 — Loading States
- **Impacto:** Utilizadores com screen readers não recebem feedback quando o conteúdo está a carregar.
- **Evidência:** `src/App.tsx`, `src/components/calendar/components/LoadingState.tsx` — spinners sem `role="status"` ou `aria-label`.

```tsx
// ❌ Actual (App.tsx loading screen)
<div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
<p className="text-slate-500 font-medium animate-pulse">A carregar...</p>

// ✅ Recomendado
<div
  role="status"
  aria-live="polite"
  aria-label="A carregar a aplicação"
  className="flex flex-col items-center gap-4"
>
  <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" aria-hidden="true" />
  <p className="text-slate-500 font-medium">A carregar...</p>
</div>
```

---

### 🔵 LOW PRIORITY

| ID | Módulo | Descrição | Esforço |
|---|---|---|---|
| LU-01 | M6 | `aria-label` em falta no botão de visibilidade de password em `LoginPage.tsx` e `RegisterPage.tsx` | XS |
| LU-02 | M7 | `ErrorBoundary.tsx` (shared) em inglês: "Oops! Something went wrong" — inconsistência com PT-PT | XS |
| LU-03 | M3 | Menu com 10 itens (4 principais + 6 ferramentas) — agrupamento existe mas 6 ferramentas secundárias podem overwhelmar | S |
| LU-04 | M2 | Pesquisa global (`SearchModal`) usa dados mock estáticos — sem pesquisa real na base de dados | M |
| LU-05 | M7 | Validação de email muito permissiva: `email.includes('@')` — aceita `a@` como válido | XS |
| LU-06 | M8 | Sem optimistic UI — todas as acções são pessimistas (bloquear UI até resposta do servidor) | L |

---

## Análise por Módulo

### M1 — UX Walkthrough & First-Time Experience

**Score: 10/10** 🟢 Excelente

| Verificação | Status |
|---|---|
| Tour interactivo | ❌ Ausente (sem -1 pois é bónus) |
| Empty states | ✅ 2 componentes: `EmptyState.tsx` (shared, 157L) + `calendar/EmptyState.tsx` (55L) |
| Error states | ✅ 2 Error Boundaries: global + calendar + form validation |
| Loading states | ✅ `LoadingState.tsx` com 4 variantes: week-view, agenda-view, month-view, spinner |
| Success states | ✅ 9+ toasts de sucesso com mensagens contextualizadas |
| Progress indicators | ✅ `WizardProgress.tsx` (135L) + step bars no RegisterPage |

**Este módulo é o ponto alto do projecto.** A implementação de estados de UI é industrial e consistente:

**Empty State Avançado** (`src/components/shared/EmptyState.tsx`):
- 5 variações de cor (sky, emerald, purple, amber, slate)
- Acção primária + acção secundária
- Secção de dicas contextuais com bullet points
- Animações escalonadas (spring entry para o ícone, fade para o texto)

```tsx
// Exemplo de uso exemplar
<EmptyState
  icon={Calendar}
  color="sky"
  title="Sem sessões agendadas"
  description="Agenda a primeira sessão para começar a acompanhar o progresso."
  action={{ label: "Agendar Sessão", icon: Plus, onClick: onSchedule }}
  secondaryAction={{ label: "Ver templates", onClick: onTemplates }}
  tips={[
    "Cria templates reutilizáveis para poupar tempo",
    "Define recorrência para sessões semanais"
  ]}
/>
```

**Loading State** (`src/components/calendar/components/LoadingState.tsx`):
- Skeleton staggered para week-view (7 colunas × 3 eventos cada)
- Skeleton animated para agenda-view (5 itens sequenciais)
- Spinner duplo animado (anel externo lento + anel interno rápido)
- `LoadingState` com prop `variant` para seleccionar a variante certa

---

### M2 — Onboarding

**Score: 9/10** 🟢 Excelente

| Verificação | Status |
|---|---|
| Documentação onboarding (end-user) | ⚠️ SETUP_GUIDE.md existe mas é técnica |
| In-app onboarding flow | ✅ RegisterPage 3-step wizard (535 linhas) |
| Welcome email | ❌ Não detectado |
| Tooltips contextuais | ✅ HelpTooltip component (143 linhas) |

**Penalizações:** Documentação de onboarding para utilizador final: -1
**Score: 10 - 1 = 9**

O fluxo de registo em 3 passos é exemplar:

**Passo 1 — Informação Básica:**
- Campo nome (placeholder `João Silva`)
- Campo email (placeholder `seu@email.com`)
- Campo password com indicador de força (Fraca/Média/Boa/Forte com cores)
- Confirmação de password

**Passo 2 — Seleção de Role:**
- Cards visuais com emoji (🏋️ Treinador vs 💪 Atleta)
- Descrições contextuais por role
- Checkmark visual quando seleccionado
- Border animado sky-500 no card activo

**Passo 3 — Config específica por role:**
- *Coach*: Nome do ginásio + tipo de treino (5 opções em dropdown)
- *Atleta*: Código de treinador opcional + warning contextual explicativo

**Indicador de Progresso:**
- 3 barras horizontais que preenchem gradualmente com gradiente sky
- Step counter dinâmico "Passo X de 3"
- Botão "Continuar" vs "Criar Conta" no último passo

O único gap é a ausência de tooltips nas funcionalidades do Dashboard pós-login para utilizadores que entram pela primeira vez.

---

### M3 — Arquitectura de Informação

**Score: 5/10** 🟡 Médio

| Verificação | Status |
|---|---|
| Config de navegação detectável | ✅ `navItems` em `App.tsx` |
| Breadcrumbs em páginas de detalhe | ❌ Ausente (ficheiro não existe) |
| Pesquisa global | ✅ `SearchModal` com Cmd/Ctrl+K |
| Página 404 | ❌ Ausente |
| Menu > 7 itens sem agrupamento | ⚠️ 10 itens (agrupados mas muitos) |

**Penalizações:**
- Sem breadcrumbs: -2
- Sem 404: -2
- Menu > 7 itens (10, com agrupamento parcial): -1
- **Total: 10 - 5 = 5**

**Estrutura de Navegação Actual:**

```
Sidebar Desktop:
├── "Menu Principal"
│   ├── Home
│   ├── Atletas
│   ├── Calendário
│   └── Lab
├── "Ferramentas"
│   ├── Design Studio
│   ├── Data OS
│   ├── Form Center
│   ├── 📊 Histórico Forms
│   ├── Automation
│   └── Live Command
└── (Settings implícito no Header)

Bottom Nav Mobile:
├── Home
├── Atletas
├── [FAB central]
├── Calendário
└── Lab
```

O agrupamento "Menu Principal" vs "Ferramentas" é correcto mas 6 ferramentas secundárias é demasiado para um sidebar. Considerar colapsar "Ferramentas" num sub-menu expansível ou mover para uma página "Mais".

---

### M4 — Mecanismos de Feedback

**Score: 2/10** 🔴 Crítico

| Verificação | Status |
|---|---|
| Analytics integrado | ❌ AUSENTE |
| Toast notifications | ✅ Sonner, 15+ chamadas em App.tsx |
| Botão/formulário de feedback | ❌ AUSENTE |
| NPS / inquérito in-app | ❌ AUSENTE |
| Error tracking | ❌ COMENTADO no código |

**Serviços detectados:** Sonner (toast) ✅ | Sentry (parcial, comentado) ⚠️

**Penalizações:**
- Sem analytics: -3
- Toasts presentes: 0
- Sem feedback in-app: -3
- Sem NPS: -1
- Sem error tracking efectivo: -1
- **Total: 10 - 8 = 2**

O único mecanismo de feedback real são os toasts com Sonner. Estão bem implementados com 9 tipos de mensagens de sucesso contextualizadas (cada uma com o nome do elemento criado/modificado) e 5+ tipos de erro com mensagens claras. A configuração é cuidada: `borderRadius: 12px`, posição `top-right`, `fontSize: 14px`.

Mas sem analytics, a equipa não sabe se os utilizadores chegam ao passo 3 do registo, quanto tempo passam no calendário, ou quais funcionalidades são usadas. Sem feedback in-app, utilizadores não têm voz. Sem error tracking, erros em produção são invisíveis.

---

### M5 — Consistência Visual

**Score: 5/10** 🟡 Médio

| Verificação | Status |
|---|---|
| Design system / Storybook | ❌ AUSENTE |
| Tokens de cor | ✅ OKLCH palette + CSS vars |
| Stories de componentes | ❌ AUSENTE |
| Mistura de bibliotecas de ícones | ✅ Apenas Lucide React |

**Penalizações:**
- Sem design system/Storybook: -3
- Tokens presentes: 0
- Sem stories: -2
- Ícones unificados: 0
- **Total: 10 - 5 = 5**

O design system *implícito* está bem construído — tokens OKLCH, componentes partilhados (`Card`, `StatCard`, `Modal`, `EmptyState`, `HelpTooltip`, `InfoBadge`), gradientes padronizados (sky-500→sky-600 para primário, emerald para sucesso, amber para warning, violet para info, red para danger). Mas tudo vive apenas no código — não há Storybook, não há documentação de componentes, não há catálogo visual. Um designer ou developer novo não consegue explorar o sistema sem ler código.

---

### M6 — Acessibilidade

**Score: 7/10** 🟢 Bom

| Verificação | Status |
|---|---|
| aria-labels em elementos interactivos | ⚠️ Faltam em ícones e botões icon-only |
| Alt text em imagens | ✅ Avatar com `alt={user.name \|\| 'User'}` |
| HTML semântico | ✅ `<header>`, `<nav>`, `<main>`, `<form>`, `<label>`, h1-h3 |
| Foco visível (:focus-visible) | ✅ `focus:ring-2 focus:ring-sky-500/30` |
| Labels em formulários | ✅ Todos os campos com `<label>` explícito |
| Ferramentas axe/eslint-plugin | ✅ axe-playwright (testes E2E) + @radix-ui (primitivos acessíveis) |

**Problemas encontrados:** ~20 botões icon-only sem aria-label

**Penalizações:**
- Sem aria-labels suficientes em interactivos: -2
- axe-playwright presente: 0 (não penaliza)
- eslint-plugin-jsx-a11y ausente: -1
- **Total: 10 - 3 = 7**

**Pontos fortes que elevam o score:**

1. **Radix UI** — todos os componentes Radix têm WAI-ARIA implementado correctamente por defeito (Dialog, DropdownMenu, Accordion, etc.). Mesmo sem aria-labels manuais, os modais Radix têm `aria-modal="true"`, `role="dialog"`, e focus trap automático.

2. **HTML semântico correcto** — `<header>`, `<nav>`, `<main>`, `<form>` usados nos lugares certos. Labels associadas a inputs em todos os formulários (LoginPage, RegisterPage, CreateAthleteModal).

3. **Focus rings** — `focus:ring-2 focus:ring-sky-500/30` em todos os inputs e `focus:outline-none` substituído por ring visível. Botões com `focus:ring-2` também.

4. **axe-playwright** — testes de acessibilidade automatizados que verificam conformidade WCAG.

**O que falta:**

```tsx
// Exemplos de aria-labels em falta:

// ❌ Header — botão de notificações sem label
<button className="p-2 rounded-lg hover:bg-slate-100">
  <Bell className="h-5 w-5 text-slate-600" />
</button>

// ✅ Correcção
<button className="p-2 rounded-lg hover:bg-slate-100" aria-label="Ver notificações">
  <Bell className="h-5 w-5 text-slate-600" aria-hidden="true" />
</button>

// ❌ LoginPage — botão toggle password sem label
<button type="button" onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
</button>

// ✅ Correcção
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
  aria-pressed={showPassword}
>
  {showPassword
    ? <EyeOff className="h-4 w-4" aria-hidden="true" />
    : <Eye className="h-4 w-4" aria-hidden="true" />}
</button>
```

---

### M7 — Microcopy

**Score: 9/10** 🟢 Excelente

| Verificação | Status |
|---|---|
| Mensagens de erro | ✅ Claras e accionáveis ("Preencha todos os campos", "Passwords não coincidem") |
| Placeholders nos formulários | ✅ Todos os campos têm placeholder descritivo |
| Erros técnicos expostos | ✅ Protegidos — dev mode only no ErrorBoundary |
| CTAs descritivos | ✅ "Criar Atleta", "Agendar Sessão", "Enviar Form" — nunca "Clique aqui" |
| Tooltips em funcionalidades complexas | ✅ `HelpTooltip` com título e conteúdo contextual |
| Linguagem consistente | ⚠️ 95% PT-PT, shared ErrorBoundary em EN |

**Penalizações:**
- Linguagem inconsistente: -1
- **Total: 10 - 1 = 9**

**Inventário de Microcopy nos Pontos de Atrito:**

| Momento | Texto actual | Qualidade |
|---|---|---|
| Login — campo vazio | "Preencha todos os campos" | ✅ Claro |
| Login — email inválido | "Email inválido" | ⚠️ Poderia ser mais específico |
| Login — erro auth | Mensagem do servidor ou "Erro ao fazer login" | ✅ Dinâmico |
| Register — passwords diferentes | "Passwords não coincidem" | ✅ Claro |
| Register — password fraca | "Password deve ter pelo menos 6 caracteres" | ✅ Accionável |
| Create athlete — campos obrigatórios | "Preencha todos os campos obrigatórios" | ✅ Claro |
| Workspace switch | "Mudou para workspace: [nome]" | ✅ Contextualizado |
| Loading login | "A entrar..." | ✅ Humanizado |
| Loading register | "A criar conta..." | ✅ Humanizado |
| Loading app | "A carregar..." | ✅ Humanizado |

**Password strength labels:**
```
Sem caracteres → (vazio)
1-2 chars      → "Fraca" (vermelho)
3-4 chars      → "Média" (amarelo)
5 chars        → "Boa" (verde)
6+ chars       → "Forte" (verde escuro)
```

O microcopy é um dos pontos mais fortes do projecto. A linguagem é consistente em PT-PT, directa, sem jargão técnico, e as mensagens de erro são sempre accionáveis.

---

### M8 — Loading States & Performance Percepcionada

**Score: 4/10** 🟠 Fraco

| Verificação | Status |
|---|---|
| Skeleton screens | ✅ `LoadingState.tsx` com 4 variantes |
| Lazy loading de imagens | ❌ `loading="lazy"` ausente no avatar |
| Code splitting (React.lazy) | ❌ AUSENTE — todos os imports estáticos |
| Optimistic UI | ❌ AUSENTE — UI bloqueia em todas as acções |
| Progress em uploads | N/A (sem funcionalidade de upload) |

**Penalizações:**
- Skeleton presente: 0
- Sem lazy loading: -2
- Sem code splitting: -2
- Sem optimistic UI: -2
- **Total: 10 - 6 = 4**

Os skeleton screens são excelentes — o problema está na performance estrutural. Com 50+ imports estáticos em App.tsx, o utilizador descarrega o código de `DesignStudio`, `DataOS`, `AutomationHub`, `LiveCommand`, e todas as outras páginas na primeira visita, mesmo que nunca as use. Isto aumenta o TTI e o bundle size desnecessariamente.

Para acções frequentes (criar atleta, agendar sessão), o UI bloqueia com `isLoading = true` enquanto espera a resposta do servidor. Com optimistic UI, o atleta apareceria instantaneamente na lista e reverteria em caso de erro — experiência muito mais fluida.

---

## Roadmap de Melhorias

### Fase 1 — Alto Impacto (Sprint 1-2)

- [ ] **Activar Sentry** — Substituir `@sentry/nextjs` por `@sentry/react`, descomentar captureException no ErrorBoundary | Esforço: S (2h) | Biblioteca: `@sentry/react`
- [ ] **Integrar PostHog analytics** — Tracking dos 5 eventos críticos (signup, athlete_created, session_scheduled, form_sent, login) | Esforço: S (3h) | Biblioteca: `posthog-js`
- [ ] **Lazy loading de páginas** — `React.lazy` + `Suspense` para todas as pages em App.tsx | Esforço: M (4h) | Biblioteca: Built-in React
- [ ] **aria-labels em botões icon-only** — Header (5 botões), FAB, LoginPage toggle password, modal close buttons | Esforço: S (2h) | Biblioteca: Nenhuma
- [ ] **aria-current="page" na navegação** — Desktop sidebar + mobile bottom nav | Esforço: XS (30min) | Biblioteca: Nenhuma

### Fase 2 — Médio Impacto (Sprint 3-4)

- [ ] **Breadcrumbs** — Componente `Breadcrumbs.tsx` + integrar em AthleteProfile, FormHistory | Esforço: S (2h)
- [ ] **Página 404** — `NotFound.tsx` + wildcard routing | Esforço: XS (30min)
- [ ] **Feedback widget** — Modal simples com 3 tipos (bug, ideia, outro) + webhook/email | Esforço: M (3h)
- [ ] **Sentry error tracking nos ErrorBoundaries** — descomentar e ligar | Esforço: XS (30min)
- [ ] **SharedErrorBoundary em PT-PT** — traduzir "Something went wrong" | Esforço: XS (10min)
- [ ] **Storybook setup** — Instalar e criar stories para 8 componentes core | Esforço: L (1-2 dias)

### Fase 3 — Melhorias Incrementais (Backlog)

- [ ] **Optimistic UI** — Para createAthlete, scheduleSession, sendForm — reduz percepção de latência | Esforço: L
- [ ] **Dark mode toggle** — `next-themes` já está no package.json, só falta implementar | Esforço: M
- [ ] **Pesquisa real** — Substituir mock data em SearchModal por queries Supabase | Esforço: M
- [ ] **Validação email robusta** — Substituir `email.includes('@')` por regex ou biblioteca `zod` | Esforço: XS
- [ ] **Tour interactivo** — Para utilizadores que entram pela primeira vez no Dashboard | Esforço: L | Biblioteca: `driver.js`
- [ ] **loading="lazy" em avatares** — `<img loading="lazy">` no Header | Esforço: XS (5min)
- [ ] **Tooltips acessíveis por teclado** — HelpTooltip com `onFocus`/`onBlur` | Esforço: S

---

## Bibliotecas Recomendadas

| Problema | Biblioteca | Motivo |
|---|---|---|
| Error tracking | `@sentry/react` | Substituir `@sentry/nextjs` (projecto é Vite, não Next.js) |
| Analytics | `posthog-js` | Open-source, RGPD, EU servers, plano gratuito generoso |
| Tour interactivo | `driver.js` | Leve (6KB), sem dependências, acessível |
| Feedback in-app | Custom component | 2h, zero dependência externa |
| Storybook | `@storybook/react-vite` | Vite-first, integra directamente com o setup actual |
| Validação forms | `zod` | Type-safe, já compatível com TypeScript |
| Acessibilidade lint | `eslint-plugin-jsx-a11y` | Detecta problemas em tempo real no IDE |

---

## Resumo de Scores

```
M1 UX Walkthrough       ██████████ 10/10  🟢  (estados exemplares: loading, empty, error, success)
M2 Onboarding           █████████░  9/10  🟢  (wizard 3-step excelente, tooltips presentes)
M3 Arquitectura Info    █████░░░░░  5/10  🟡  (pesquisa OK, sem breadcrumbs, sem 404)
M4 Mecanismos Feedback  ██░░░░░░░░  2/10  🔴  (zero analytics, zero feedback in-app, Sentry comentado)
M5 Consistência Visual  █████░░░░░  5/10  🟡  (tokens OK, sem Storybook, sem stories)
M6 Acessibilidade       ███████░░░  7/10  🟢  (Radix + axe + HTML semântico, faltam aria-labels)
M7 Microcopy            █████████░  9/10  🟢  (PT-PT, CTAs descritivos, erros claros e accionáveis)
M8 Loading States       ████░░░░░░  4/10  🟠  (skeleton excelente, sem lazy/code-splitting/optimistic)

GLOBAL (ponderado)      ██████░░░░  6.6/10 🟡 Médio
```

**Nota final:** O PerformTrack tem o melhor walkthrough UX que seria possível esperar nesta fase — estados, animações, microcopy e onboarding são todos de nível profissional. O gap é de 3 dimensões específicas: **observabilidade** (sem analytics/Sentry activo), **performance estrutural** (sem lazy loading), e **feedback loop** (sem canal de feedback do utilizador). Com 2 sprints de trabalho focalizado, o score sobe facilmente para 8.5+/10.

---

*Relatório gerado pelo Audit UX Pro Plugin — Protocolo C9 v2.0*
*Projecto: PerformTrack (V-Login2) | Data: 28 de Março de 2026 | Auditor: Claude*
