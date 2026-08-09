<!-- Instruksi untuk AI coding assistant saat develop project ini -->

# AGENTS - Instruksi untuk AI Assistant

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## Project Context

Ini adalah sistem manajemen budidaya udang berbasis AI untuk petambak Indonesia. Fokus MVP:
- Manajemen multiple kolam
- Logbook pakan & probiotik
- Rekomendasi AI untuk pakan & probiotik
- Evaluasi per siklus panen

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Icons:** Lucide Icons

---

## Coding Conventions

### File Naming
- Components: `PascalCase.tsx` (e.g., `PondCard.tsx`)
- Utilities: `kebab-case.ts` (e.g., `format-date.ts`)
- Hooks: `use-kebab-case.ts` (e.g., `use-ponds.ts`)
- Types: `kebab-case.types.ts` (e.g., `pond.types.ts`)

### Component Structure
```tsx
// 1. Imports
import { ... } from "...";

// 2. Types
interface Props {
  ...
}

// 3. Component
export function ComponentName({ ... }: Props) {
  // hooks
  // derived state
  // handlers
  // render
  return (...)
}
```

### Database Queries
- Gunakan Supabase client dari `@/lib/supabase`
- Server components: `createServerClient`
- Client components: `createBrowserClient`
- Selalu handle error dengan proper error messages

### API Routes
- Gunakan Route Handlers di `app/api/`
- Validasi input dengan Zod
- Return proper HTTP status codes
- Format response: `{ data, error, message }`

---

## Important Files

- `docs/SPEC.md` — Spesifikasi fitur dan user flow
- `docs/DESIGN.md` — Database schema dan API design
- `docs/UI-GUIDE.md` — Design system dan komponen

---

## Do's and Don'ts

### Do
- Gunakan TypeScript strict mode
- Buat komponen yang reusable
- Handle loading dan error states
- Tulis kode yang accessible (a11y)
- Gunakan Server Components untuk data fetching
- Validasi semua user input

### Don't
- Jangan hardcode credentials
- Jangan skip error handling
- Jangan buat komponen yang terlalu besar (split jika > 200 baris)
- Jangan gunakan `any` type
- Jangan fetch data di Client Component jika bisa di Server Component

---

## Bahasa

- UI/UX: Bahasa Indonesia (untuk end user)
- Code comments: English
- Variable names: English
