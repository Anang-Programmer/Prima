"use client";

import { AlertTriangle, Heart, MessageCircle, X } from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  dueAlarms: any[];
  communityNotifs?: any[];
}

export function NotificationDropdown({ isOpen, onClose, dueAlarms, communityNotifs = [] }: NotificationDropdownProps) {
  const router = useRouter();

  if (!isOpen) return null;

  async function handleCommunityNotifClick(notif: any) {
    // Tandai sudah dibaca
    await supabase.from("notifications").update({ is_read: true }).eq("id", notif.id);
    router.push(`/komunitas/${notif.post_id}`);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 z-50 overflow-hidden text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
          <h3 className="font-bold text-sm">Notifikasi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>
        
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Community Notifications */}
          {communityNotifs.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleCommunityNotifClick(notif)}
              className={`flex items-start gap-3 border-b border-slate-100 p-4 hover:bg-slate-50 transition cursor-pointer ${!notif.is_read ? 'bg-blue-50/50' : 'bg-white'}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notif.type === 'LIKE' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                {notif.type === 'LIKE' ? <Heart size={20} className="fill-current" /> : <MessageCircle size={20} />}
              </div>
              <div className="flex-1 relative">
                <p className={`text-xs leading-snug ${!notif.is_read ? 'text-slate-800' : 'text-slate-600'}`}>
                  <span className="font-bold">{notif.actor_name}</span> {notif.type === 'LIKE' ? 'menyukai postingan Anda' : 'berkomentar pada postingan Anda'}
                </p>
                <span className={`text-[10px] mt-1 block ${!notif.is_read ? 'text-[#2ABFC8] font-semibold' : 'text-slate-400'}`}>
                  {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {!notif.is_read && <span className="absolute top-1 right-0 h-2 w-2 rounded-full bg-[#2ABFC8]" />}
              </div>
            </div>
          ))}

          {/* Due Alarms */}
          {dueAlarms.map((item, idx) => (
            <div key={item.timer.id || idx} className="flex flex-col gap-2 border-b border-slate-100 p-4 hover:bg-slate-50 transition">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-medium text-slate-500">Alarm Kolam ({item.timer.type})</p>
                  <p className="text-sm font-bold text-slate-800">{item.pond?.pond_name}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/kolam/${item.pond?.pond_id}`);
                    onClose();
                  }}
                  className="rounded-lg bg-[#2ABFC8] px-3 py-2 text-[11px] font-bold text-white shadow-sm transition active:scale-95"
                >
                  Buka Kolam
                </button>
              </div>
            </div>
          ))}

          {dueAlarms.length === 0 && communityNotifs.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              Tidak ada notifikasi baru.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
