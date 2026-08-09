<!-- Panduan design system: warna, typography, dan komponen UI -->

# UI-GUIDE - Design System

> **FINALIZED:** Color palette approved for implementation. Mobile-first approach with desktop enhancements.

---

## 1. Color Palette

### Primary (Biru - Akuakultur)
```css
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #56C1CD; /* Main */
--primary-600: #56C1CD;
--primary-700: #1d4ed8;
--primary-800: #0A4D58;
--primary-900: #0A4D58;
```

### Neutral (Gray)
```css
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #002530;
```

### Semantic Colors
```css
--success: #22c55e; /* Hijau - berhasil */
--warning: #f59e0b; /* Kuning - peringatan */
--error: #ef4444;   /* Merah - error */
--info: #56C1CD;    /* Biru - informasi */
```

---

## 2. Typography

### Font Family
- **Primary:** Inter (Google Fonts)
- **Fallback:** system-ui, sans-serif

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

---

## 3. Spacing

Menggunakan skala 4px:
```
4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px
```

---

## 4. Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

---

## 5. Komponen UI

### Menggunakan shadcn/ui
- Button
- Input
- Card
- Dialog/Modal
- Select
- Table
- Toast/Notification
- Tabs
- Dropdown Menu

### Custom Components (akan dibuat)
- PondCard â€” kartu info kolam
- CycleProgress â€” progress siklus budidaya
- FeedingChart â€” grafik pemberian pakan
- RecommendationCard â€” kartu rekomendasi AI
- LogEntry â€” item log harian

---

## 6. Layout

### Breakpoints
```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

### Container
- Max width: 1280px
- Padding horizontal: 16px (mobile), 24px (desktop)

### Navigation
- Mobile: Bottom navigation bar
- Desktop: Sidebar (collapsible)

---

## 7. Icons

Menggunakan **Lucide Icons** (sudah include di shadcn)

---

## 8. Dark Mode

Support dark mode untuk kenyamanan penggunaan malam hari.
- Toggle manual di settings
- Atau ikuti system preference

---

## 9. Mobile-Specific Components

### Touch Targets
**Minimum size:** 44×44px (iOS/Android standard)
**Recommended:** 48×48px for primary actions

`css
.button-mobile {
  min-height: 48px;
  min-width: 48px;
  padding: 12px 20px;
}

.nav-item-mobile {
  min-height: 56px;
  min-width: 64px;
}
`

### Bottom Navigation Bar
`	sx
<nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t">
  {/* 4 nav items, each 64px width minimum */}
</nav>
`

**Items:**
- Dashboard (Home icon)
- Kolam (Fish icon)
- Logbook (BookOpen icon)
- Profil (User icon)

### Mobile Input Fields
`css
.input-mobile {
  min-height: 48px;
  font-size: 16px; /* Prevent zoom on iOS */
  padding: 12px 16px;
}
`

### Mobile Cards
`css
.card-mobile {
  padding: 16px;
  border-radius: 12px;
  margin: 0 16px 12px;
}

.card-desktop {
  padding: 24px;
  border-radius: 18px;
  margin: 0 0 24px;
}
`

### Mobile Typography Scale
`css
/* Mobile base (320-639px) */
--mobile-h1: 28px;
--mobile-h2: 24px;
--mobile-h3: 20px;
--mobile-body: 16px;
--mobile-caption: 14px;

/* Desktop (1024px+) */
--desktop-h1: 56px;
--desktop-h2: 40px;
--desktop-h3: 28px;
--desktop-body: 17px;
--desktop-caption: 14px;
`

---

## 10. Component Data Binding

### PondCard
**Props:**
\\\	ypescript
interface PondCardProps {
  id: string;
  name: string;
  area_m2: number;
  active_cycle: {
    id: string;
    shrimp_count: number;
    start_date: string;
    doc: number;
  } | null;
}
\\\

### CycleProgress
**Props:**
\\\	ypescript
interface CycleProgressProps {
  cycle_id: string;
  doc: number;
  target_doc: number; // Usually 90-120 days
  status: 'active' | 'completed';
}
\\\

### RecommendationCard
**Props:**
\\\	ypescript
interface RecommendationCardProps {
  doc: number;
  recommended_feed_kg: number;
  recommended_probiotic_ml: number;
  reasoning: string;
  feeding_frequency: string;
}
\\\

### LogEntry
**Props:**
\\\	ypescript
interface FeedLogEntryProps {
  id: string;
  feed_type: string;
  amount_kg: number;
  feeding_time: 'pagi' | 'siang' | 'sore' | 'malam';
  logged_at: string;
}

interface ProbioticLogEntryProps {
  id: string;
  probiotic_type: string;
  amount_ml: number;
  logged_at: string;
}
\\\

---

## 11. Responsive Behavior

### Mobile-First Approach
\\\css
/* Base styles (mobile) */
.container {
  padding: 16px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}
\\\

### Component Adaptation

| Component | Mobile (=640px) | Tablet (641-1023px) | Desktop (=1024px) |
|-----------|-----------------|---------------------|-------------------|
| Navigation | Bottom bar | Bottom bar | Sidebar |
| Cards | 1 column | 2 columns | 3 columns |
| Forms | Stacked labels | Stacked labels | Inline labels |
| Tables | Card list | Scrollable table | Full table |
| Buttons | Full width | Auto width | Auto width |

---

## 12. Interaction States

### Touch Feedback
\\\css
.button:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}
\\\

### Loading States
- Skeleton screens for initial load
- Inline spinners (24px) for actions
- Progress bars for long operations

### Error States
- Inline error messages below input
- Toast notifications for system errors
- Banner for critical warnings

---

## 13. Accessibility

### Screen Reader Support
\\\	sx
<button aria-label="Tambah kolam baru">
  <Plus className="w-6 h-6" />
</button>
\\\

### Keyboard Navigation
- Tab order follows visual flow
- Focus indicators visible
- Escape closes modals

### Color Contrast
- Text: minimum 4.5:1 (AA)
- Large text (=18px): minimum 3:1
- Test in bright sunlight conditions


