# Relatório de Auditoria Design System Pro — Protocolo C10

**Projecto:** V-Login
**Data:** 2026-03-28
**Protocolo:** C10 – Design System Pro Audit & Generation v1.0
**Auditor:** Claude (Audit Design System Pro Plugin)
**Referência Figma:** https://www.figma.com/design/BXldmHTk0QIcaVoRIKFuZ3/V-Login

---

## Sumário Executivo

### Score Global: **8.0 / 10** — 🟢 Bom

| Módulo | Score | Status |
|---|---|---|
| M1 — Cores | 7.0/10 | 🟡 Médio |
| M2 — Tipografia | 9.0/10 | 🟢 Bom |
| M3 — Espaçamento | 9.0/10 | 🟢 Bom |
| M4 — Ícones | 9.0/10 | 🟢 Bom |
| M5 — Animações | 7.0/10 | 🟡 Médio |
| M6 — Componentes | 8.0/10 | 🟢 Bom |

> **Cálculo ponderado:**
> M1×1.3 + M2×1.2 + M3×1.1 + M4×1.0 + M5×1.0 + M6×1.2 =
> 9.1 + 10.8 + 9.9 + 9.0 + 7.0 + 9.6 = 55.4 ÷ 6.8 = **8.15 → 8.0/10**

---

### Achados por Severidade

| Severidade | Quantidade |
|---|---|
| 🔴 CRITICAL | 1 |
| 🟠 HIGH | 1 |
| 🟡 MEDIUM | 4 |
| 🔵 LOW | 4 |
| ⚪ INFO | 4 |

---

### Stack Detectada

- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.3.5 + SWC (@vitejs/plugin-react-swc)
- **Styling:** CSS Custom Properties + Tailwind CSS (tailwind-merge, CVA, clsx detectados)
- **Linguagem:** TypeScript
- **Componentes Base:** Radix UI (suite completa — 25 primitivos)
- **Ícones:** Lucide React 0.487.0
- **Animações:** Motion (Framer Motion)
- **Mobile:** Capacitor 8.0.2 (Android)
- **Backend:** Supabase (Auth + Database)
- **Meta-framework:** Next.js (presente nas dependências)

---

### Diagnóstico Rápido

O projecto **V-Login** apresenta uma base sólida com stack moderna e bem escolhida. O uso de Radix UI como fundação de componentes e Lucide React como biblioteca única de ícones são decisões arquitecturais correctas que conferem consistência e acessibilidade. O maior problema detectado é a **ausência de `prefers-reduced-motion`** (CRITICAL, viola WCAG 2.1 §2.3.3), que afecta utilizadores com sensibilidade a movimento. No plano das cores, existem aproximadamente 20 valores hexadecimais hardcoded nos artefactos de build sem sistema formal de tokens CSS, o que fragiliza a manutenção a longo prazo. O sistema de tipografia é limpo (uma única família de sistema, escala de 8 tamanhos), mas todos os valores de tamanho estão em `px` em vez de `rem`/`em`, penalizando a acessibilidade em navegadores com zoom de texto. O espaçamento segue uma grelha consistente de 4px, o que é exemplar. A falta de documentação JSDoc nos componentes fonte é o único ponto fraco da arquitectura de componentes, que é de resto muito bem estruturada com base nos primitivos Radix UI.

---

## Achados Detalhados

---

### 🔴 CRITICAL

#### C-001 — Ausência de `prefers-reduced-motion`

- **Módulo:** M5 — Animações
- **Localização:** `build/assets/index-BY0wt5DS.css` e `build/assets/index-ZnOniovJ.js` (global)
- **Descrição:** O projecto utiliza extensivamente a biblioteca Motion (Framer Motion) com 30+ ocorrências de `duration` e animações customizadas (e.g., `animate-pulse-border` em CSS), mas não implementa em nenhum ponto o media query `@media (prefers-reduced-motion: reduce)`. Isto significa que utilizadores com epilepsia fotossensível, vestibular disorders ou outras condições neurológicas são forçados a ver todas as animações, independentemente das suas preferências de sistema operativo.
- **Impacto:** Violação directa da WCAG 2.1 Critério de Sucesso 2.3.3 (AAA) e boas práticas de acessibilidade de nível AA. Em contexto mobile (Capacitor/Android), o sistema operativo expõe esta preferência via `AccessibilityManager.isAnimationEnabled()`.
- **Remediação:**

```css
/* Adicionar ao ficheiro CSS global ou tokens.css */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
// Para componentes Motion, usar a hook useReducedMotion:
import { useReducedMotion } from 'motion/react';

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
    />
  );
}
```

---

### 🟠 HIGH

#### H-001 — Credenciais Supabase expostas em ficheiro `.env` commitado

- **Módulo:** Segurança / Configuração
- **Localização:** `V-Login/.env`
- **Descrição:** O ficheiro `.env` contém `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` e está incluído no bundle/repositório. Embora a `ANON_KEY` seja tecnicamente pública por design do Supabase (é uma chave JWT com permissões limitadas), commitar ficheiros `.env` é uma má prática que pode levar a exposição acidental de chaves privadas.
- **Remediação:**
  1. Adicionar `.env` ao `.gitignore` imediatamente
  2. Criar `.env.example` com valores placeholder
  3. Usar variáveis de ambiente no CI/CD sem commitar valores reais
  4. Verificar no Supabase Dashboard se as RLS policies estão correctamente configuradas (dado que a anon key é exposta no cliente, as Row Level Security policies são a única barreira de acesso)

---

### 🟡 MEDIUM

#### M-001 — ~20 Cores Hexadecimais Hardcoded sem Sistema Formal de Tokens

- **Módulo:** M1 — Cores
- **Localização:** `build/assets/index-ZnOniovJ.js` (múltiplos locais)
- **Descrição:** Foram detectadas aproximadamente 20 cores hexadecimais hardcoded nos artefactos de build, indicando que o código fonte tem estas cores codificadas directamente em componentes React (inline styles ou className arbitrários). Embora existam CSS custom properties (`--` detectadas no bundle), não há evidência de um sistema de tokens formalmente definido e centralizado.

**Cores hardcoded detectadas:**
```
#0ea5e9  (Sky-500 — primary)
#0284c7  (Sky-600 — primary hover)
#8b5cf6  (Violet-500)
#7c3aed  (Violet-600)
#d1fae5  (Emerald-100 — success bg)
#047857  (Emerald-700 — success text)
#fee2e2  (Red-100 — error bg)
#dc2626  (Red-600 — error text)
#fef3c7  (Amber-100 — warning bg)
#f59e0b  (Amber-400 — warning)
#d97706  (Amber-600 — warning dark)
#10b981  (Emerald-500)
#ef4444  (Red-500)
#e2e8f0  (Slate-200 — border)
#f8fafc  (Slate-50 — bg)
#f1f5f9  (Slate-100 — bg alt)
#cbd5e1  (Slate-300 — border)
#64748b  (Slate-500 — muted text)
#475569  (Slate-600 — secondary text)
#0f172a  (Slate-900 — headings)
```

- **Remediação:** Criar um ficheiro de tokens CSS centralizado e substituir os valores hardcoded por variáveis CSS (`var(--color-primary)`) ou classes Tailwind do tema configurado.

---

#### M-002 — Tamanhos de Fonte Todos em `px` (sem `rem`/`em`)

- **Módulo:** M2 — Tipografia
- **Localização:** `build/assets/index-ZnOniovJ.js` (inline styles em componentes)
- **Descrição:** Os 8 tamanhos de fonte detectados (11px, 12px, 14px, 16px, 18px, 24px, 28px, 32px) estão expressos em unidades absolutas `px`. Isto impede que o texto escale proporcionalmente quando o utilizador altera o tamanho base de fonte no browser (acessibilidade WCAG 1.4.4 — Resize Text AA).
- **Remediação:** Converter para `rem` (relativo ao root): `11px → 0.6875rem`, `12px → 0.75rem`, `14px → 0.875rem`, `16px → 1rem`, `18px → 1.125rem`, `24px → 1.5rem`, `28px → 1.75rem`, `32px → 2rem`. Se usar Tailwind, os utilitários `text-xs`, `text-sm`, `text-base`, etc. já usam `rem` por defeito.

---

#### M-003 — Cobertura de Acessibilidade em Ícones Insuficiente

- **Módulo:** M4 — Ícones
- **Localização:** `build/assets/index-ZnOniovJ.js` (múltiplos componentes)
- **Descrição:** Apenas 6 ocorrências de `aria-label` e 2 de `aria-hidden` foram detectadas no bundle JS, apesar do projecto usar Lucide React com dezenas de ícones. A maioria dos ícones são provavelmente renderizados sem atributos de acessibilidade — ícones puramente decorativos devem ter `aria-hidden="true"` e ícones interactivos/informativos devem ter `aria-label` ou título.
- **Remediação:**
```tsx
// Ícone decorativo (dentro de botão com texto)
<Button>
  <PlusIcon aria-hidden="true" />
  Adicionar
</Button>

// Ícone como único conteúdo do botão
<Button aria-label="Adicionar novo item">
  <PlusIcon aria-hidden="true" />
</Button>

// Ícone informativo standalone
<AlertCircle aria-label="Aviso: campo obrigatório" />
```

---

#### M-004 — `appId` Capacitor em Valor Placeholder

- **Módulo:** Configuração Mobile
- **Localização:** `capacitor.config.json:3`
- **Descrição:** O `appId` está definido como `"com.example.app"`, que é um valor placeholder genérico. Em produção, este valor identifica a aplicação na Google Play Store e deve ser único e de propriedade do developer.

```json
{
  "appId": "com.example.app",  // ← DEVE SER ALTERADO
  "appName": "V-Login",
  "webDir": "build"
}
```

- **Remediação:** Definir um `appId` único no formato reverse-domain: `com.vlogin.app` ou `pt.vlogin.app`.

---

### 🔵 LOW / ⚪ INFO

| ID | Severidade | Módulo | Descrição | Remediação |
|---|---|---|---|---|
| L-001 | 🔵 LOW | M1 — Cores | Paleta usa HSL implícito (via Tailwind) mas não há paleta OKLCH definida. OKLCH é perceptualmente uniforme e recomendado para design systems modernos. | Definir paleta OKLCH nos tokens CSS. |
| L-002 | 🔵 LOW | M6 — Componentes | Ausência de documentação JSDoc nos componentes fonte. Dado que o código fonte está arquivado em `srcVELHO.zip`, é impossível confirmar a cobertura, mas o bundle não evidencia comentários documentais. | Adicionar JSDoc nos componentes públicos e hooks. |
| L-003 | 🔵 LOW | M5 — Animações | Animação `animate-pulse-border` customizada em CSS sem token de duração definido. Favorece inconsistência com outras animações do Motion. | Extrair duração para variável CSS `--duration-pulse`. |
| L-004 | 🔵 LOW | Configuração | Código fonte principal ausente do repositório — apenas `build/` e `srcVELHO.zip` disponíveis. Isto impossibilita análise estática e refactoring. | Restaurar `src/` como directório activo no repositório. |
| I-001 | ⚪ INFO | M1 — Stack | CSS Custom Properties detectadas — o projecto já usa variáveis CSS. Base adequada para sistema de tokens. | — |
| I-002 | ⚪ INFO | M4 — Ícones | Apenas 1 biblioteca de ícones (Lucide React) — decisão óptima para consistência. | — |
| I-003 | ⚪ INFO | M2 — Tipografia | System font stack bem definida (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto`). Elimina dependência de Google Fonts, melhora performance e privacidade. | — |
| I-004 | ⚪ INFO | M6 — Componentes | Suite Radix UI completa instalada (25 primitivos). Excelente fundação acessível e unstyled. | — |

---

## Análise por Módulo

---

### M1 — Cores

**Score: 7.0/10**

- Cores únicas detectadas: ~20
- Clusters de cores: 4 (azul/sky, violeta, semânticas status, neutros slate)
- Cores hardcoded: ~20 valores hex no bundle
- Problemas de contraste: Não detectados directamente (build minificada)
- Cor mais usada: `#0ea5e9` (Sky-500 — primary)
- Sistema de tokens: CSS custom properties presentes, mas sem ficheiro centralizado

**Cálculo de score:**
- Base: 10
- 5-20 cores hardcoded: -1
- Sem paleta formalmente definida em tokens: -2
- Total: **7/10**

**Detalhe dos clusters de cores:**

| Cluster | Cores | Uso |
|---|---|---|
| Primary (Sky) | `#0ea5e9`, `#0284c7` | CTAs, links, elementos interactivos |
| Accent (Violet) | `#8b5cf6`, `#7c3aed` | Destaques, badges premium |
| Semânticas | `#10b981` (success), `#ef4444` (error), `#f59e0b` (warning) | Feedback, status |
| Neutros (Slate) | `#f8fafc` → `#0f172a` (6 tons) | Backgrounds, texto, bordas |

**Paleta OKLCH Sugerida (baseada no Sky-500 como primário):**

```css
:root {
  /* Primary — Sky */
  --color-primary-50:  oklch(97% 0.04 220);
  --color-primary-100: oklch(94% 0.07 220);
  --color-primary-300: oklch(82% 0.13 220);
  --color-primary-500: oklch(68% 0.18 220);   /* ≈ #0ea5e9 */
  --color-primary-600: oklch(59% 0.17 220);   /* ≈ #0284c7 */
  --color-primary-700: oklch(50% 0.15 220);
  --color-primary-900: oklch(32% 0.10 220);

  /* Accent — Violet */
  --color-accent-500: oklch(60% 0.22 275);    /* ≈ #8b5cf6 */
  --color-accent-600: oklch(53% 0.24 275);    /* ≈ #7c3aed */

  /* Semânticas */
  --color-success:  oklch(68% 0.17 162);      /* ≈ #10b981 */
  --color-error:    oklch(57% 0.22 27);       /* ≈ #ef4444 */
  --color-warning:  oklch(76% 0.16 68);       /* ≈ #f59e0b */

  /* Neutros */
  --color-surface:   oklch(99% 0.00 0);
  --color-surface-2: oklch(97% 0.01 230);
  --color-border:    oklch(88% 0.02 230);
  --color-muted:     oklch(56% 0.03 230);
  --color-text:      oklch(15% 0.02 250);
}
```

---

### M2 — Tipografia

**Score: 9.0/10**

- Famílias de fonte: 1 (system font stack)
- Tamanhos únicos: 8 (11, 12, 14, 16, 18, 24, 28, 32px)
- Pesos únicos: 3 (600, 700, 800)
- font-display: N/A (system fonts não precisam de font-display)
- Google Fonts: Não utilizado (positivo — privacy + performance)
- line-height: Não confirmado explicitamente, assumido adequado via Tailwind defaults

**Cálculo de score:**
- Base: 10
- Todos em px (sem rem/em): -1
- Total: **9/10**

**Escala Tipográfica Sugerida (conversão para rem, razão modular 1.25):**

```css
:root {
  --font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI',
                      Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-family-mono: 'SF Mono', 'Fira Code', Consolas, monospace;

  --text-2xs:  0.6875rem;  /* 11px */
  --text-xs:   0.75rem;    /* 12px */
  --text-sm:   0.875rem;   /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg:   1.125rem;   /* 18px */
  --text-xl:   1.5rem;     /* 24px */
  --text-2xl:  1.75rem;    /* 28px */
  --text-3xl:  2rem;       /* 32px */

  --font-medium:     500;
  --font-semibold:   600;
  --font-bold:       700;
  --font-extrabold:  800;

  --leading-tight:   1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.625;
}
```

---

### M3 — Espaçamento

**Score: 9.0/10**

- Sistema de espaçamento: Presente (grelha 4px via Tailwind implícito)
- Valores fora da grelha 4px: Não detectados
- Tailwind arbitrary spacing: Não detectado nos artefactos
- Variáveis de espaçamento: CSS custom properties presentes

**Cálculo de score:**
- Base: 10
- Alguns valores irregulares possíveis (não confirmáveis via build): -1 (precaução)
- Total: **9/10**

**Escala de Espaçamento Sugerida (base 4px):**

```css
:root {
  --space-1:  0.25rem;  /* 4px  */
  --space-2:  0.5rem;   /* 8px  */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

---

### M4 — Ícones

**Score: 9.0/10**

- Bibliotecas: 1 (Lucide React v0.487.0) ✅
- Formato: SVG ✅
- Ícones sem acessibilidade: ~estimado 5-20 (apenas 6 aria-label + 2 aria-hidden detectados)
- Ícones PNG/JPG: Não detectados ✅

**Cálculo de score:**
- Base: 10
- 5-20 ícones sem acessibilidade: -1
- Total: **9/10**

**Recomendação de unificação:** Manter Lucide React. Criar um wrapper `Icon` que force boas práticas:

```tsx
interface IconProps {
  icon: LucideIcon;
  label?: string;        // aria-label para ícones interactivos
  decorative?: boolean;  // aria-hidden="true" para decorativos
  size?: number;
  className?: string;
}

export function Icon({ icon: LucideIcon, label, decorative = false, size = 16, className }: IconProps) {
  if (decorative) {
    return <LucideIcon size={size} aria-hidden="true" className={className} />;
  }
  if (!label) {
    console.warn('[Icon] Ícone não-decorativo sem aria-label. Forneça um label.');
  }
  return <LucideIcon size={size} aria-label={label} role="img" className={className} />;
}
```

---

### M5 — Animações

**Score: 7.0/10**

- Animações lentas (>500ms): Não confirmadas (build minificada), Motion usa defaults de 0.3s
- prefers-reduced-motion: **NÃO implementado** ❌
- Keyframes duplicados: `animate-pulse-border` detectado; duplicados não confirmáveis
- Easing functions: Não confirmadas, Motion usa easing próprio
- Biblioteca: Motion (Framer Motion) ✅ — escolha correcta para React

**Cálculo de score:**
- Base: 10
- Sem prefers-reduced-motion: -3
- Total: **7/10**

**Tokens de Animação Sugeridos:**

```css
:root {
  /* Durações */
  --duration-instant:    50ms;
  --duration-fast:      100ms;   /* hover/focus */
  --duration-normal:    200ms;   /* entrada de elementos */
  --duration-moderate:  300ms;   /* modais/overlays */
  --duration-slow:      500ms;   /* page transitions */

  /* Easings */
  --ease-default:   cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard */
  --ease-in:        cubic-bezier(0.4, 0, 1, 1);
  --ease-out:       cubic-bezier(0, 0, 0.2, 1);
  --ease-spring:    cubic-bezier(0.34, 1.56, 0.64, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant:  0ms;
    --duration-fast:     0ms;
    --duration-normal:   0ms;
    --duration-moderate: 0ms;
    --duration-slow:     0ms;
  }
}
```

---

### M6 — Componentes

**Score: 8.0/10**

- Total de componentes: Stack completa via Radix UI (25+ primitivos)
- Primitivos detectados: Accordion, AlertDialog, Avatar, Checkbox, Collapsible, ContextMenu, Dialog, DropdownMenu, HoverCard, Label, Menubar, NavigationMenu, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Slider, Switch, Tabs, Toggle, ToggleGroup, Tooltip
- Componentes adicionais: cmdk (Command Palette), Vaul (Drawer), Embla Carousel, Sonner (Toasts), react-day-picker
- Primitivos em falta: Nenhum crítico (Radix cobre tudo) ✅
- Documentação JSDoc: Não confirmada (código fonte arquivado)
- Componentes > 300 linhas: Não confirmável
- Dead components: `srcVELHO.zip` sugere código legado arquivado

**Cálculo de score:**
- Base: 10
- JSDoc não confirmado (< 50% provavelmente): -2
- Total: **8/10**

**Componentes Primitivos Recomendados para Geração (baseados na stack):**

```tsx
// Button — TSX com CVA
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:   'bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]',
        secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
        outline:   'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-2)]',
        ghost:     'hover:bg-[var(--color-surface-2)]',
        danger:    'bg-[var(--color-error)] text-white hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3 text-[var(--text-sm)]',
        md: 'h-10 px-4 text-[var(--text-base)]',
        lg: 'h-12 px-6 text-[var(--text-lg)]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size })} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
```

---

## Guia de Escolha de Novo Visual

### Paleta de Cores Sugerida (OKLCH)

A paleta actual baseia-se em Tailwind Sky + Slate, que é uma escolha sólida. A migração para OKLCH mantém as mesmas cores mas com perceptual uniformity:

| Token | OKLCH | Hex Equivalente | Uso |
|---|---|---|---|
| `--color-primary-500` | `oklch(68% 0.18 220)` | #0ea5e9 | CTAs principais |
| `--color-primary-600` | `oklch(59% 0.17 220)` | #0284c7 | Hover/active |
| `--color-accent-500` | `oklch(60% 0.22 275)` | #8b5cf6 | Destaques |
| `--color-success` | `oklch(68% 0.17 162)` | #10b981 | Feedback positivo |
| `--color-error` | `oklch(57% 0.22 27)` | #ef4444 | Feedback negativo |
| `--color-warning` | `oklch(76% 0.16 68)` | #f59e0b | Avisos |
| `--color-text` | `oklch(15% 0.02 250)` | #0f172a | Texto principal |

**Porquê OKLCH?** É perceptualmente uniforme — as transições entre cores parecem naturais ao olho humano e funcionam consistentemente em todos os monitores. O Tailwind v4 já usa OKLCH internamente.

### Escala Tipográfica Sugerida

Manter a system font stack actual (excelente decisão) mas converter para rem com escala modular 1.25:

`0.69 → 0.75 → 0.875 → 1.0 → 1.25 → 1.5 → 1.875 → 2.25`

### Fontes Sugeridas (alternativa se quiser custom fonts)

- **Corpo:** Inter (system fallback actual é similar)
- **Mono:** JetBrains Mono ou Fira Code
- Se adicionar: configurar `font-display: swap` e subsetting

### Tokens de Animação Sugeridos

Ver secção M5 — aplicar tokens CSS de duração com `prefers-reduced-motion` override.

### Escala de Espaçamento Sugerida

Base 4px já em uso — formalizar como CSS custom properties (ver secção M3).

---

## Tutorial de Uniformização

### 1. Criar ficheiro central de tokens

Criar `src/styles/tokens.css`:

```css
/* tokens.css — V-Login Design System v1.0 */
:root {
  /* === CORES === */
  --color-primary-500: oklch(68% 0.18 220);
  --color-primary-600: oklch(59% 0.17 220);
  --color-accent-500:  oklch(60% 0.22 275);
  --color-success:     oklch(68% 0.17 162);
  --color-error:       oklch(57% 0.22 27);
  --color-warning:     oklch(76% 0.16 68);
  --color-surface:     oklch(99% 0.00 0);
  --color-surface-2:   oklch(97% 0.01 230);
  --color-border:      oklch(88% 0.02 230);
  --color-muted:       oklch(56% 0.03 230);
  --color-text:        oklch(15% 0.02 250);

  /* === TIPOGRAFIA === */
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --text-2xs:   0.6875rem;
  --text-xs:    0.75rem;
  --text-sm:    0.875rem;
  --text-base:  1rem;
  --text-lg:    1.125rem;
  --text-xl:    1.5rem;
  --text-2xl:   1.75rem;
  --text-3xl:   2rem;
  --leading-body: 1.5;

  /* === ESPAÇAMENTO === */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;

  /* === ANIMAÇÕES === */
  --duration-fast:     100ms;
  --duration-normal:   200ms;
  --duration-moderate: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast:     0ms;
    --duration-normal:   0ms;
    --duration-moderate: 0ms;
  }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2. Integrar os tokens no projecto

```tsx
// src/main.tsx
import './styles/tokens.css';
import './styles/globals.css';
```

Se usar Tailwind, mapear os tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
        },
        success: 'var(--color-success)',
        error:   'var(--color-error)',
        warning: 'var(--color-warning)',
      },
    },
  },
};
```

### 3. Substituir valores hardcoded

```bash
# Detectar cores hardcoded nos ficheiros fonte
grep -rn "#[0-9a-fA-F]\{3,8\}" src/ --include="*.tsx" --include="*.css"
# Substituir por variáveis CSS: var(--color-primary-500)
```

### 4. Adoptar componentes primitivos

Os componentes Radix UI já estão instalados — wrappá-los com os tokens do design system (ver exemplo Button acima).

### 5. Configurar ESLint para prevenir regressões

```json
{
  "rules": {
    "no-restricted-syntax": ["warn", {
      "selector": "JSXAttribute[name.name='style']",
      "message": "Evite estilos inline — use classes Tailwind ou variáveis CSS do design system."
    }]
  }
}
```

### 6. Restaurar código fonte

Descomprimir `srcVELHO.zip` para `src/` e reactivar como directório de trabalho activo para permitir análise estática, testes e refactoring adequados.

---

## Plano de Remediação

### Fase 1 — Crítico (Semana 1-2)

- [ ] **Implementar prefers-reduced-motion** — Adicionar media query global no CSS e integrar `useReducedMotion` da Motion nos componentes animados. | Esforço: 2h | Impacto: WCAG 2.1 compliance
- [ ] **Remover `.env` do repositório** — Adicionar `.env` ao `.gitignore`, criar `.env.example`, verificar se foi commitado em histórico git (usar `git filter-branch` se necessário). | Esforço: 1h | Impacto: Segurança

### Fase 2 — Alta Prioridade (Semana 3-4)

- [ ] **Criar ficheiro de tokens CSS centralizado** — Formalizar todas as ~20 cores, tamanhos, espaçamentos e durações como CSS custom properties em `src/styles/tokens.css`. | Esforço: 4h
- [ ] **Converter tamanhos de fonte para `rem`** — Substituir todos os valores em `px` nos componentes por equivalentes em `rem`. | Esforço: 3h
- [ ] **Actualizar `appId` Capacitor** — Definir ID único de produção em `capacitor.config.json`. | Esforço: 15min
- [ ] **Auditar e corrigir acessibilidade de ícones** — Percorrer todos os usos de Lucide React e adicionar `aria-hidden="true"` ou `aria-label` conforme o contexto. | Esforço: 2h

### Fase 3 — Melhorias (Mês 2)

- [ ] **Migrar cores para OKLCH** — Implementar paleta OKLCH sugerida.
- [ ] **Adicionar JSDoc aos componentes públicos** — Documentar props, variantes e exemplos de uso.
- [ ] **Criar wrapper `Icon`** — Wrapper tipado que força boas práticas de acessibilidade em ícones.
- [ ] **Configurar Storybook** — Documentar todos os componentes primitivos com histórias interactivas.
- [ ] **Restaurar e auditar `srcVELHO.zip`** — Verificar dead code e componentes legados para limpeza.

---

## Ficheiros Sugeridos para Geração

```
src/
├── styles/
│   ├── tokens.css          ← Design tokens centralizados
│   └── globals.css         ← Estilos globais com prefers-reduced-motion
├── components/
│   └── ui/
│       ├── Button.tsx       ← Button com CVA e variantes
│       ├── Input.tsx        ← Input com label, error, a11y
│       ├── Card.tsx         ← Card com padding configurável
│       └── Icon.tsx         ← Wrapper Lucide com a11y forçada
tailwind.config.js           ← Extensão com tokens do design system
```

---

*Relatório gerado pelo Audit Design System Pro Plugin — Protocolo C10 v1.0*
*Projecto: V-Login | Data: 2026-03-28 | Auditor: Claude (Sonnet 4.6)*
