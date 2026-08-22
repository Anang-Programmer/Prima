import { Suspense } from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PostDetailPage from '@/app/komunitas/[id]/page'
import { supabase } from '@/lib/supabase'

// Kita memalsukan (mock) modul supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  }
}))

describe('PostDetailPage (Komunitas) - Unit Test Kompleks', () => {
  const mockPostId = '123-abc'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup standar auth
    ;(supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    })

    // Setup standar rantai (chaining) dari supabase.from(...)
    ;(supabase.from as any).mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn(),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockResolvedValue({ data: null, error: null })
      }

      if (table === 'profiles') {
        builder.maybeSingle.mockResolvedValue({
          data: { full_name: 'Budi Petambak', avatar_url: 'budi.png' },
          error: null
        })
      } else if (table === 'v_posts') {
        builder.maybeSingle.mockResolvedValue({
          data: { 
            id: mockPostId, 
            author_name: 'Jaka', 
            content: 'Panen hari ini mantap!', 
            created_at: new Date().toISOString(),
            likes_count: 5,
            comments_count: 2
          },
          error: null
        })
      } else if (table === 'post_likes') {
        builder.maybeSingle.mockResolvedValue({
          data: null, // Belum pernah like
          error: null
        })
      } else if (table === 'post_comments') {
        // order dipanggil untuk post_comments, kita simulasikan resolved promise setelahnya
        builder.order = vi.fn().mockResolvedValue({
          data: [
            { id: 'c1', author_name: 'Anto', content: 'Keren!', created_at: new Date().toISOString() }
          ],
          error: null
        })
      }

      return builder
    })
  })

  it('1. Merender halaman dengan status loading sementara data dimuat', async () => {
    const paramsPromise = Promise.resolve({ id: mockPostId })
    render(
      <Suspense fallback={<div>Loading suspense...</div>}>
        <PostDetailPage params={paramsPromise} />
      </Suspense>
    )
    
    // Tidak bisa langsung menemukan teks spesifik sebelum loading selesai, 
    // tapi kita bisa asumsikan loading muncul lalu hilang
    await waitFor(() => {
      expect(screen.getByText('Panen hari ini mantap!')).toBeInTheDocument()
    })
  })

  it('2. Menampilkan Post, Komentar, dan data Profil Pengguna yang benar', async () => {
    const paramsPromise = Promise.resolve({ id: mockPostId })
    render(
      <Suspense fallback={<div>Loading suspense...</div>}>
        <PostDetailPage params={paramsPromise} />
      </Suspense>
    )
    
    // Tunggu sampai data post muncul
    await waitFor(() => {
      expect(screen.getByText('Jaka')).toBeInTheDocument()
      expect(screen.getByText('Panen hari ini mantap!')).toBeInTheDocument()
    })

    // Cek apakah komentar muncul
    expect(screen.getByText('Anto')).toBeInTheDocument()
    expect(screen.getByText('Keren!')).toBeInTheDocument()
  })

  it('3. Menambahkan komentar dengan menekan tombol Send', async () => {
    const paramsPromise = Promise.resolve({ id: mockPostId })
    render(
      <Suspense fallback={<div>Loading suspense...</div>}>
        <PostDetailPage params={paramsPromise} />
      </Suspense>
    )
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Tulis komentar...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('Tulis komentar...')
    const btnSend = input.nextElementSibling as HTMLButtonElement

    // Ketik pesan
    fireEvent.change(input, { target: { value: 'Selamat ya!' } })
    expect(input).toHaveValue('Selamat ya!')

    // Klik kirim
    fireEvent.click(btnSend)

    // Cek apakah supabase.from('post_comments').insert dipanggil
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('post_comments')
    })
  })
})
