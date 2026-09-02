"use client";

import { useEffect, useState } from "react";
import { BarChart3, Heart, Home, Loader2, MessageCircle, Plus, Send, Share2, User} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import TambahKolamSheet from "@/components/tambah-kolam-sheet";

type Post = {
  id: string; author_name: string; avatar_url: string; content: string;
  created_at: string; likes_count: number; comments_count: number; liked_by_me?: boolean;
};
type Comment = { id: string; author_name: string; avatar_url: string; content: string; created_at: string };

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "2-digit" })}, ${d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
};

function Avatar({ name, url, size = 40 }: { name: string; url?: string; size?: number }) {
  if (url) return <img src={url} alt={name} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div className="flex shrink-0 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-600" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(name || "?")[0]?.toUpperCase()}
    </div>
  );
}

const DEMO: Post[] = [0, 1, 2].map((i) => ({
  id: `demo-${i}`, author_name: "Mahmud", avatar_url: "",
  content: "Panen kemarin 4.2 ton dari 600m2. ABW 18gr, FCR 1.35. Pakai probiotik Bacillus sp sejak hari ke-7, cleaning 2x seminggu rutin.",
  created_at: "2026-08-15T16:05:00+07:00", likes_count: 0, comments_count: 0,
}));

export default function KomunitasPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [reload, setReload] = useState(0);
  const [me, setMe] = useState<{ id: string; name: string; avatar: string } | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [busy, setBusy] = useState(false);

  const [commentPost, setCommentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showTambah, setShowTambah] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("anon");
        const [{ data: prof }, { data: rows }, { data: myLikes }] = await Promise.all([
          supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
          supabase.from("v_posts").select("*").order("created_at", { ascending: false }).limit(50),
          supabase.from("post_likes").select("post_id").eq("user_id", user.id),
        ]);
        setMe({ id: user.id, name: prof?.full_name || "Petambak", avatar: prof?.avatar_url || "" });
        const liked = new Set((myLikes ?? []).map((l: any) => l.post_id));
        setPosts(((rows ?? []) as Post[]).map((p) => ({ ...p, liked_by_me: liked.has(p.id) })));
      } catch {
        setPosts(DEMO); setIsDemo(true);
      }
    })();
  }, [reload]);

  const refresh = () => setReload((r) => r + 1);

  async function requireLogin() {
    if (!me) { window.location.href = "/masuk"; return false; }
    return true;
  }

  async function toggleLike(p: Post) {
    if (!(await requireLogin())) return;
    setBusy(true);
    if (p.liked_by_me) {
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", me!.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: p.id, user_id: me!.id });
      fetch("/api/notifikasi/sosial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: p.id, actor_name: me!.name, type: "LIKE", current_user_id: me!.id })
      }).catch(() => {});
    }
    setBusy(false); refresh();
  }

  async function share(p: Post) {
    const text = `${p.author_name} di Prima Komunitas: "${p.content}"`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  }

  async function createPost() {
    if (!(await requireLogin()) || !newPost.trim()) return;
    setBusy(true);
    await supabase.from("posts").insert({ user_id: me!.id, author_name: me!.name, avatar_url: me!.avatar, content: newPost.trim() });
    setNewPost(""); setShowCreate(false); setBusy(false); refresh();
  }

  async function openComments(p: Post) {
    router.push(`/komunitas/${p.id}`);
  }

  // addComment is no longer used here as it's moved to the detail page

  return (
    <div className="min-h-screen bg-[#F1F4F5] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />
      <div className="w-full md:flex-1 md:overflow-y-auto">
      <div className="mx-auto w-full max-w-md pb-28 md:max-w-7xl md:pb-12 md:pt-4">
        {/* ============ HEADER ============ */}
        <header className="flex items-center justify-between px-4 pb-4 pt-6 md:px-8">
          <h1 className="text-lg font-bold md:text-2xl">Komunitas</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-full bg-[#2ABFC8] px-4 py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              <Plus size={14} /> Buat Post
            </button>
          </div>
        </header>

        {isDemo && (
          <p className="mx-4 mb-3 rounded-lg bg-amber-100 px-3 py-2 text-[11px] text-amber-700">
            Mode pratinjau — <a href="/masuk" className="font-bold underline">login</a> untuk ikut berinteraksi.
          </p>
        )}

        {/* ============ FEED ============ */}
        <main className="space-y-4 px-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:space-y-0">
          {!posts && <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" /></div>}
          {posts?.map((p) => (
            <article 
              key={p.id} 
              onClick={() => router.push(`/komunitas/${p.id}`)}
              className="rounded-xl bg-white p-4  hover:bg-[#F1F4F5] transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.author_name} url={p.avatar_url} />
                <div>
                  <p className="text-xs font-bold">{p.author_name}</p>
                  <p className="text-[10px] text-slate-400">{fmtDate(p.created_at)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 line-clamp-3">{p.content}</p>
              
              <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLike(p); }} 
                  className="transition active:scale-90 flex items-center gap-1.5"
                >
                  <Heart size={18} className={p.liked_by_me ? "fill-[#F26B4E] text-[#F26B4E]" : "text-slate-500"} />
                  <span className="text-xs font-semibold text-slate-500">{p.likes_count}</span>
                </button>
                <button 
                  className="transition active:scale-90 flex items-center gap-1.5"
                >
                  <MessageCircle size={18} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500">{p.comments_count}</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); share(p); }} 
                  className="transition active:scale-90 ml-auto"
                >
                  <Share2 size={18} className="text-slate-500" />
                </button>
              </div>
            </article>
          ))}
        </main>
      </div>
      </div>

      {/* ============ BOTTOM NAV + FAB ============ */}
      <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <div className="relative border-t border-slate-100 bg-white">
          <button onClick={() => setShowTambah(true)}
            className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-[#2ABFC8] text-white  ring-4 ring-white/70 transition active:scale-95">
            <Plus size={24} />
          </button>
          <div className="grid grid-cols-5">
            {[
              { label: "Beranda", icon: Home, href: "/dashboard", active: false },
              { label: "Proyeksi", icon: BarChart3, href: "/proyeksi", active: false },
              { empty: true },
              { label: "Komunitas", icon: MessageCircle, href: "/komunitas", active: true },
              { label: "Profil", icon: User, href: "/profil", active: false },
            ].map((item: any) => {
              if (item.empty) return <div key="empty" className="pointer-events-none" />;
              const { label, icon: Icon, href, active } = item;
              return (
                <a key={label} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${active ? "text-[#1C9098]" : "text-slate-400"}`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? "fill-[#1C9098]/20" : ""} />
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ============ SHEET: BUAT POST ============ */}
      {showCreate && (
        <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center">
          <button aria-label="Tutup" onClick={() => setShowCreate(false)} className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-[24px] bg-white px-4 pb-8 pt-3 md:relative md:w-full md:max-w-md md:rounded-xl md:p-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300" />
            <h3 className="mb-4 text-base font-bold">Bagikan Pengalaman</h3>
            <textarea rows={4} value={newPost} onChange={(e) => setNewPost(e.target.value)}
              placeholder="cth. Panen kemarin 4.2 ton dari 600m2. ABW 18gr, FCR 1.35..."
              className="w-full rounded-[10px] bg-[#E7EAEB] px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-[#2ABFC8]/50" />
            <button onClick={createPost} disabled={busy || !newPost.trim()}
              className="mt-4 w-full rounded-[10px] bg-[#2ABFC8] py-3 text-sm font-semibold text-white disabled:opacity-60">
              {busy ? <Loader2 className="mx-auto animate-spin" size={16} /> : "Posting"}
            </button>
          </div>
        </div>
      )}

      {/* ============ SHEET: KOMENTAR ============ */}
      {/* Komentar Popup dihilangkan, sekarang menggunakan halaman detail */}

      <TambahKolamSheet
        open={showTambah}
        onClose={() => setShowTambah(false)}
        onSaved={() => {
          setShowTambah(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
