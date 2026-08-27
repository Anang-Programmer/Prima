"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Heart, Loader2, MessageCircle, Send, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { DesktopSidebar } from "@/components/DesktopSidebar";

type Post = {
  id: string;
  author_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  liked_by_me?: boolean;
};

type Comment = {
  id: string;
  author_name: string;
  avatar_url: string;
  content: string;
  created_at: string;
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "2-digit",
  })}, ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string;
  size?: number;
}) {
  if (url)
    return (
      <img
        src={url}
        alt={name}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-slate-300 font-bold text-slate-600"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
      }}
    >
      {(name || "?")[0]?.toUpperCase()}
    </div>
  );
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: postId } = use(params);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [me, setMe] = useState<{
    id: string;
    name: string;
    avatar: string;
  } | null>(null);

  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", user.id)
            .maybeSingle();

          setMe({
            id: user.id,
            name: prof?.full_name || "Petambak",
            avatar: prof?.avatar_url || "",
          });
        }

        // Fetch Post
        const { data: postData } = await supabase
          .from("v_posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (postData) {
          let liked = false;

          if (user) {
            const { data: myLike } = await supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", postId)
              .eq("user_id", user.id)
              .maybeSingle();

            liked = !!myLike;
          }

          setPost({
            ...postData,
            liked_by_me: liked,
          } as Post);
        }

        // Fetch Comments
        const { data: commentsData } = await supabase
          .from("post_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at");

        setComments((commentsData ?? []) as Comment[]);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [postId, reload]);

  const refresh = () => setReload((r) => r + 1);

  async function requireLogin() {
    if (!me) {
      window.location.href = "/masuk";
      return false;
    }
    return true;
  }

  async function toggleLike() {
    if (!post || !(await requireLogin())) return;

    setBusy(true);

    if (post.liked_by_me) {
      await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", me!.id);
    } else {
      await supabase
        .from("post_likes")
        .insert({ post_id: post.id, user_id: me!.id });
      
      fetch("/api/notifikasi/sosial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: post.id, actor_name: me!.name, type: "LIKE", current_user_id: me!.id })
      }).catch(() => {});
    }

    setBusy(false);
    refresh();
  }

  async function share() {
    if (!post) return;

    const text = `${post.author_name} di Prima Komunitas: "${post.content}"`;

    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {}
  }

  async function addComment() {
    if (!post || !(await requireLogin()) || !newComment.trim()) return;

    setBusy(true);

    await supabase.from("post_comments").insert({
      post_id: post.id,
      user_id: me!.id,
      author_name: me!.name,
      avatar_url: me!.avatar,
      content: newComment.trim(),
    });

    fetch("/api/notifikasi/sosial", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: post.id, actor_name: me!.name, type: "COMMENT", current_user_id: me!.id })
    }).catch(() => {});

    setNewComment("");
    setBusy(false);
    refresh();
  }

  return (
    <div className="min-h-screen bg-[#F1F4F5] text-slate-800 md:flex md:h-screen md:overflow-hidden">
      <DesktopSidebar />

      <div className="w-full md:flex-1 md:overflow-y-auto bg-[#F1F4F5]">
        <div className="mx-auto flex h-screen w-full flex-col md:h-auto md:max-w-7xl md:py-8">

          {/* HEADER */}
          <header className="sticky top-0 z-10 flex shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-4 pb-4 pt-5 md:border-none md:bg-transparent md:px-8">
            <button
              onClick={() => router.back()}
              className="rounded-full p-1.5 text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={21} />
            </button>

            <h1 className="text-[18px] font-semibold text-slate-800 md:text-2xl md:font-bold">
              Komunitas
            </h1>
          </header>

          <main className="flex flex-1 flex-col overflow-y-auto md:px-8">

            {!post ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2ABFC8] border-t-transparent" />
              </div>
            ) : (
              <div className="flex flex-1 flex-col md:rounded-xl md:border md:border-slate-100 md:bg-white md:">

                {/* POST */}
                <div className="bg-white p-4 pb-2 md:rounded-t-2xl md:p-6">

                  <div className="flex items-center gap-3">
                    <Avatar
                      name={post.author_name}
                      url={post.avatar_url}
                      size={38}
                    />

                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">
                        {post.author_name}
                      </p>

                      <p className="text-[10px] text-slate-400">
                        {fmtDate(post.created_at)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-[14px] leading-[1.55] text-slate-700 md:text-base">
                    {post.content}
                  </p>

                  {/* ACTIONS */}
                  <div className="mt-4 flex items-center gap-5 border-t border-slate-200 pt-3 pb-2">

                    <button
                      onClick={toggleLike}
                      className="flex items-center gap-1.5 transition active:scale-90"
                    >
                      <Heart
                        size={18}
                        className={
                          post.liked_by_me
                            ? "fill-[#F26B4E] text-[#F26B4E]"
                            : "text-slate-400"
                        }
                      />

                      <span className="text-xs text-slate-400">
                        {post.likes_count}
                      </span>
                    </button>

                    <button className="flex items-center gap-1.5 transition active:scale-90">
                      <MessageCircle size={18} className="text-slate-400" />

                      <span className="text-xs text-slate-400">
                        {comments.length}
                      </span>
                    </button>

                    <button
                      onClick={share}
                      className="ml-0 transition active:scale-90 md:ml-auto"
                    >
                      <Share2 size={18} className="text-slate-400" />
                    </button>

                  </div>
                </div>

                {/* COMMENTS */}
                <div className="flex-1 bg-[#F8FAFB] px-4 py-4 md:px-6 md:py-6">

                  <h3 className="mb-4 text-sm font-semibold text-slate-700">
                    Komentar
                  </h3>

                  <div className="space-y-5">

                    {comments.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-400">
                        Belum ada komentar.
                      </p>
                    )}

                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-2.5"
                      >
                        <Avatar
                          name={c.author_name}
                          url={c.avatar_url}
                          size={32}
                        />

                        <div className="min-w-0 flex-1">

                          <div className="flex items-center gap-2">
                            <p className="text-[12px] font-semibold text-slate-800">
                              {c.author_name}
                            </p>

                            <span className="text-[10px] text-slate-400">
                              {fmtDate(c.created_at).split(",")[0]}
                            </span>
                          </div>

                          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                            {c.content}
                          </p>

                          <button 
                            onClick={() => {
                              setNewComment(`@${c.author_name} `);
                              const el = document.getElementById("comment-input");
                              if (el) el.focus();
                            }}
                            className="mt-1 text-[10px] text-[#2ABFC8] font-medium hover:underline transition"
                          >
                            Balas
                          </button>

                        </div>
                      </div>
                    ))}

                  </div>
                </div>

                {/* COMMENT INPUT */}
                <div className="flex items-end gap-2 border-t border-slate-100 bg-white p-3 md:rounded-b-2xl md:p-4">

                  <Avatar
                    name={me?.name || "P"}
                    url={me?.avatar}
                    size={34}
                  />

                  <textarea
                    id="comment-input"
                    rows={1}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                    placeholder="Tulis komentar"
                    className="w-full resize-none rounded-xl bg-[#EEF1F3] px-4 py-2.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#2ABFC8]/30 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  />

                  <button
                    onClick={addComment}
                    disabled={busy || !newComment.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#25C4D4] text-white  transition active:scale-95 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Send size={17} className="ml-0.5" />
                    )}
                  </button>

                </div>

              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
