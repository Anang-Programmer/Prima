"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function FcmTokenManager() {
  useEffect(() => {
    async function syncToken() {
      const w = window as any;
      if (!w.flutter_inappwebview) return;
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const result = await w.flutter_inappwebview.callHandler("getFcmToken");
        if (result && result.token) {
          await supabase.from("device_tokens").upsert({
            user_id: user.id,
            fcm_token: result.token,
            platform: "android",
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,fcm_token' });
        }
      } catch (e) {
        console.error("Failed to sync FCM token:", e);
      }
    }

    // Delay sedikit untuk memastikan inappwebview bridge sudah siap
    const timer = setTimeout(syncToken, 2500);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
