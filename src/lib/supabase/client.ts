import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Client untuk Browser / Client Components
 * Gunakan ini di file yang ada "use client" di atasnya.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
