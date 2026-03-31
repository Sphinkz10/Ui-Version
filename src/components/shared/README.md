# 📚 Shared Components Documentation

**PerformTrack Design System**  
**Version:** 2.0  
**Last Updated:** Janeiro 2025

---

## 📦 Components Overview

Esta pasta contém os componentes shared reutilizáveis da aplicação PerformTrack, construídos seguindo 100% o Design System (Guidelines.md).

### Componentes Disponíveis:

1. **ResponsiveTabBar** - Sistema de navegação por tabs adaptativo
2. **ResponsiveModal** - Modal responsivo com variantes
3. **AdaptiveCard** - Cards adaptativos com múltiplas variantes

---

## 🎯 ResponsiveTabBar

Sistema de navegação por tabs que se adapta automaticamente ao dispositivo.

### Features

- ✅ **Desktop:** Tabs horizontais com ícones + labels
- ✅ **Mobile:** Bottom fixed bar com ícones
- ✅ Badges support (números ou texto)
- ✅ Disabled states
- ✅ 3 variantes (Default, Compact, Pill)
- ✅ Animações suaves
- ✅ Active indicator

### Basic Usage

```tsx
import { ResponsiveTabBar, TabItem } from '@/components/shared/ResponsiveTabBar';
import { Home, Calendar, Settings, User } from 'lucide-react';

const tabs: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User, disabled: true },
];

function MyApp() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <ResponsiveTabBar
      tabs={tabs}
      activeTab={activeTab}
      onChange={setActiveTab}
      position="bottom" // 'top' | 'bottom'
    />
  );
}
```

### Props

```typescript
interface TabItem {
  id: string;              // Unique identifier
  label: string;           // Display label
  icon: LucideIcon;        // Lucide icon component
  badge?: number | string; // Optional badge
  disabled?: boolean;      // Disable tab
}

interface ResponsiveTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  position?: 'top' | 'bottom'; // Mobile position
  className?: string;
}
```

### Variants

#### 1. Default (ResponsiveTabBar)
```tsx
<ResponsiveTabBar tabs={tabs} activeTab={active} onChange={setActive} />
```
- Desktop: px-6 py-3, full labels
- Mobile: Bottom bar, icons 6x6

#### 2. Compact (CompactTabBar)
```tsx
import { CompactTabBar } from '@/components/shared/ResponsiveTabBar';

<CompactTabBar tabs={tabs} activeTab={active} onChange={setActive} />
```
- Smaller sizing (px-4 py-2)
- text-xs
- Hidden labels em mobile

#### 3. Pill (PillTabBar)
```tsx
import { PillTabBar } from '@/components/shared/ResponsiveTabBar';

<PillTabBar tabs={tabs} activeTab={active} onChange={setActive} />
```
- iOS-style segmented control
- Container bg-slate-100
- Active: white bg

### Examples

#### With Badges
```tsx
const tabs = [
  { 
    id: 'notifications', 
    label: 'Notifications', 
    icon: Bell,
    badge: 5 // Red badge with "5"
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: MessageCircle,
    badge: 'NEW' // Text badge
  },
];
```

#### Disabled Tabs
```tsx
const tabs = [
  { id: 'premium', label: 'Premium', icon: Star, disabled: true },
];
```

---

## 🎯 ResponsiveModal

Modal responsivo que se adapta ao dispositivo com múltiplos estilos.

### Features

- ✅ **Desktop:** Centered modal com backdrop
- ✅ **Mobile:** Fullscreen OU Bottom sheet
- ✅ 5 tamanhos (sm, md, lg, xl, full)
- ✅ Close on backdrop click
- ✅ Close on Escape key
- ✅ Prevent body scroll
- ✅ Header + Content + Footer
- ✅ ConfirmationDialog variant

### Basic Usage

```tsx
import { ResponsiveModal } from '@/components/shared/ResponsiveModal';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>

      <ResponsiveModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        subtitle="Optional subtitle"
        size="md" // sm | md | lg | xl | full
        mobileStyle="bottomsheet" // fullscreen | bottomsheet
        footer={
          <div className="flex gap-3">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button>Confirm</button>
          </div>
        }
      >
        <div>Your modal content here</div>
      </ResponsiveModal>
    </>
  );
}
```

### Props

```typescript
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;      // default: true
  closeOnBackdrop?: boolean;      // default: true
  closeOnEscape?: boolean;        // default: true
  mobileStyle?: 'fullscreen' | 'bottomsheet'; // default: fullscreen
  className?: string;
}
```

### Size Reference

| Size | Max Width | Best For |
|------|-----------|----------|
| `sm` | 28rem (448px) | Quick confirmations |
| `md` | 32rem (512px) | Forms, simple content |
| `lg` | 42rem (672px) | Detailed forms |
| `xl` | 56rem (896px) | Complex content |
| `full` | 100% | Full-width modals |

### Mobile Styles

#### Fullscreen
```tsx
<ResponsiveModal mobileStyle="fullscreen" {...props}>
```
- Ocupa tela toda em mobile
- Header no topo, footer no bottom

#### Bottom Sheet
```tsx
<ResponsiveModal mobileStyle="bottomsheet" {...props}>
```
- Slide up from bottom
- Max-height 90vh
- Drag handle visual

### ConfirmationDialog Variant

Quick confirmation dialogs com variantes de cor.

```tsx
import { ConfirmationDialog } from '@/components/shared/ResponsiveModal';

function DeleteConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    await deleteItem();
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onConfirm={handleConfirm}
      title="Delete Item"
      message="Are you sure you want to delete this item? This action cannot be undone."
      confirmLabel="Yes, delete"
      cancelLabel="Cancel"
      variant="danger" // info | warning | danger
      isLoading={isLoading}
    />
  );
}
```

### Examples

#### Form Modal
```tsx
<ResponsiveModal
  isOpen={isOpen}
  onClose={handleClose}
  title="Create New Event"
  subtitle="Fill in the details below"
  size="lg"
  footer={
    <div className="flex justify-between w-full">
      <button onClick={handleClose}>Cancel</button>
      <button onClick={handleSubmit}>Create Event</button>
    </div>
  }
>
  <form>
    {/* Form fields */}
  </form>
</ResponsiveModal>
```

#### No Close on Backdrop
```tsx
<ResponsiveModal
  isOpen={isOpen}
  onClose={handleClose}
  closeOnBackdrop={false}
  closeOnEscape={false}
  title="Processing..."
>
  <div>Please wait while we process your request...</div>
</ResponsiveModal>
```

---

## 🎯 AdaptiveCard

Sistema de cards adaptativos com múltiplas variantes especializadas.

### Features

- ✅ Base card configurável
- ✅ 4 variantes especializadas
- ✅ Click support (button ou div)
- ✅ Hover effects
- ✅ Configurações de shadow/padding/border
- ✅ Responsive

### Base AdaptiveCard

```tsx
import { AdaptiveCard } from '@/components/shared/AdaptiveCard';

<AdaptiveCard
  onClick={() => undefined}
  hover={true}
  border={true}
  shadow="md" // none | sm | md | lg
  padding="md" // none | sm | md | lg
  className="custom-class"
>
  <div>Your content here</div>
</AdaptiveCard>
```

### Props

```typescript
interface AdaptiveCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hover?: boolean;           // default: true
  border?: boolean;          // default: true
  shadow?: 'none' | 'sm' | 'md' | 'lg'; // default: 'sm'
  padding?: 'none' | 'sm' | 'md' | 'lg'; // default: 'md'
}
```

---

### Variant 1: StatCard

Display statistics com icon, value, e change indicator.

```tsx
import { StatCard } from '@/components/shared/AdaptiveCard';
import { TrendingUp } from 'lucide-react';

<StatCard
  icon={TrendingUp}
  label="Total Revenue"
  value="€12,345"
  change="+15% vs last month"
  changeType="positive" // positive | negative | neutral
  color="emerald" // emerald | sky | amber | violet | red
  onClick={() => navigate('/revenue')}
/>
```

**Props:**
```typescript
interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color?: 'emerald' | 'sky' | 'amber' | 'violet' | 'red';
  onClick?: () => void;
}
```

**Example Grid:**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  <StatCard icon={Users} label="Athletes" value="124" color="sky" />
  <StatCard icon={Calendar} label="Events" value="45" color="emerald" />
  <StatCard icon={DollarSign} label="Revenue" value="€8,900" color="amber" />
  <StatCard icon={TrendingUp} label="Growth" value="+23%" color="violet" />
</div>
```

---

### Variant 2: ActionCard

Cards para CTAs com icon grande, title, description, e badge.

```tsx
import { ActionCard } from '@/components/shared/AdaptiveCard';
import { Plus } from 'lucide-react';

<ActionCard
  icon={Plus}
  title="Create New Event"
  description="Schedule a new training session or match"
  badge={3}
  color="emerald" // emerald | sky | amber | violet | red
  onClick={() => navigate('/create-event')}
/>
```

**Props:**
```typescript
interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string | number;
  color?: 'emerald' | 'sky' | 'amber' | 'violet' | 'red';
  onClick: () => void;
}
```

**Example Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <ActionCard
    icon={Plus}
    title="New Workout"
    description="Create a new training workout"
    color="emerald"
    onClick={handleCreateWorkout}
  />
  <ActionCard
    icon={Calendar}
    title="Schedule Event"
    description="Schedule a new event on calendar"
    badge={5}
    color="sky"
    onClick={handleSchedule}
  />
</div>
```

---

### Variant 3: ListCard

Cards para list items com avatar/icon, title, subtitle, badge, e actions.

```tsx
import { ListCard } from '@/components/shared/AdaptiveCard';
import { User } from 'lucide-react';

<ListCard
  avatar="https://example.com/avatar.jpg"
  // OR
  icon={User}
  title="João Silva"
  subtitle="joão.silva@example.com"
  badge="Active"
  badgeColor="emerald" // emerald | amber | red | sky
  actions={
    <>
      <button>Edit</button>
      <button>Delete</button>
    </>
  }
  onClick={() => navigate(`/user/${id}`)}
/>
```

**Props:**
```typescript
interface ListCardProps {
  avatar?: string;
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'red' | 'sky';
  actions?: ReactNode;
  onClick?: () => void;
}
```

**Example List:**
```tsx
<div className="space-y-3">
  {athletes.map((athlete) => (
    <ListCard
      key={athlete.id}
      avatar={athlete.avatar}
      title={athlete.name}
      subtitle={athlete.email}
      badge={athlete.status}
      badgeColor={athlete.status === 'Active' ? 'emerald' : 'amber'}
      actions={
        <button onClick={() => viewDetails(athlete.id)}>View</button>
      }
    />
  ))}
</div>
```

---

### Variant 4: MediaCard

Cards com image, title, description, badge, e footer.

```tsx
import { MediaCard } from '@/components/shared/AdaptiveCard';

<MediaCard
  image="https://example.com/workout.jpg"
  title="Advanced HIIT Workout"
  description="High intensity interval training for advanced athletes"
  badge="NEW"
  aspectRatio="16/9" // 16/9 | 4/3 | 1/1
  footer={
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">45 min</span>
      <button>Start Workout</button>
    </div>
  }
  onClick={() => navigate(`/workout/${id}`)}
/>
```

**Props:**
```typescript
interface MediaCardProps {
  image: string;
  title: string;
  description?: string;
  badge?: string;
  footer?: ReactNode;
  onClick?: () => void;
  aspectRatio?: '16/9' | '4/3' | '1/1';
}
```

**Example Grid:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {workouts.map((workout) => (
    <MediaCard
      key={workout.id}
      image={workout.thumbnail}
      title={workout.name}
      description={workout.description}
      badge={workout.difficulty}
      footer={
        <div className="flex justify-between">
          <span>{workout.duration}</span>
          <button>View</button>
        </div>
      }
      onClick={() => navigate(`/workout/${workout.id}`)}
    />
  ))}
</div>
```

---

## 🎨 Design System Compliance

Todos os componentes seguem 100% o Guidelines.md:

### Cores
- **Sky** (Primary): #0ea5e9 → #0284c7
- **Emerald** (Success): #10b981 → #059669
- **Amber** (Warning): #f59e0b → #d97706
- **Red** (Danger): #ef4444 → #dc2626
- **Violet** (Premium): #8b5cf6 → #7c3aed

### Spacing
- Mobile: `gap-3` (12px), `p-4` (16px)
- Desktop: `gap-4` (16px), `p-6` (24px)

### Border Radius
- `rounded-2xl` (16px): Cards, modals
- `rounded-xl` (12px): Buttons, tabs
- `rounded-full`: Badges, avatars

### Typography
- `text-xs` (12px): Labels
- `text-sm` (14px): Body text
- `text-2xl` (24px): Values, headers

### Shadows
- `shadow-sm`: Default cards
- `shadow-md`: Buttons
- `shadow-lg`: Elevated elements
- `shadow-xl`: Hover states
- `shadow-2xl`: Modals

---

## 🧪 Testing

Todos os componentes têm tests completos em `__tests__/`.

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test ResponsiveTabBar.test.tsx

# Watch mode
npm test --watch

# Coverage
npm test --coverage
```

### Test Coverage

- ResponsiveTabBar: 95%+
- ResponsiveModal: 95%+
- AdaptiveCard: 95%+

---

## 📖 Best Practices

### 1. Always use TypeScript
```tsx
// ✅ GOOD
const tabs: TabItem[] = [...]

// ❌ BAD
const tabs = [...]
```

### 2. Destructure props
```tsx
// ✅ GOOD
function MyComponent({ isOpen, onClose }: Props) {
  // ...
}

// ❌ BAD
function MyComponent(props) {
  const { isOpen, onClose } = props;
}
```

### 3. Use semantic colors
```tsx
// ✅ GOOD - Color has meaning
<StatCard color="emerald" changeType="positive" />

// ❌ BAD - Random color
<StatCard color="violet" changeType="positive" />
```

### 4. Mobile-first responsive
```tsx
// ✅ GOOD
<div className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

// ❌ BAD
<div className="lg:grid-cols-4 sm:grid-cols-2 grid-cols-1">
```

### 5. Handle loading states
```tsx
// ✅ GOOD
<ConfirmationDialog isLoading={isSubmitting} />

// ❌ BAD - No loading feedback
<ConfirmationDialog />
```

---

## 🚀 Performance Tips

### 1. Lazy load modals
```tsx
const ResponsiveModal = lazy(() => import('@/components/shared/ResponsiveModal'));
```

### 2. Memoize expensive computations
```tsx
const filteredTabs = useMemo(
  () => tabs.filter(tab => !tab.disabled),
  [tabs]
);
```

### 3. Avoid inline functions
```tsx
// ✅ GOOD
const handleTabChange = useCallback((id: string) => {
  setActiveTab(id);
}, []);

<ResponsiveTabBar onChange={handleTabChange} />

// ❌ BAD - Creates new function every render
<ResponsiveTabBar onChange={(id) => setActiveTab(id)} />
```

---

## 📚 Additional Resources

- **Design System:** `/Guidelines.md`
- **Calendar Components:** `/components/calendar/`
- **Figma Designs:** [Link to Figma]
- **Storybook:** [Link to Storybook]

---

## 🤝 Contributing

Ao adicionar novos componentes shared:

1. ✅ Seguir 100% Guidelines.md
2. ✅ Criar props interface em TypeScript
3. ✅ Adicionar tests (>90% coverage)
4. ✅ Documentar neste README
5. ✅ Mobile-first responsive
6. ✅ Accessibility (ARIA labels)

---

## 📝 Changelog

### Version 2.0 (Janeiro 2025)
- ✅ ResponsiveTabBar criado (3 variantes)
- ✅ ResponsiveModal criado (+ ConfirmationDialog)
- ✅ AdaptiveCard criado (+ 4 variantes)
- ✅ Tests completos (95%+ coverage)
- ✅ Documentação completa

---

**Maintainer:** PerformTrack Dev Team  
**Last Updated:** Janeiro 2025  
**Version:** 2.0
