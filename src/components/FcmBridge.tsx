"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Bridge Flutter <-> Web.
 * Setelah user login, kirim userId + accessToken ke WebView host (Flutter)
 * via flutter_inappwebview JS handler "registerFcm".
 * Di luar WebView (browser biasa), handler tidak ada -> diam saja.
 */
export default function FcmBridge() {
  useEffect(() => {
    const send = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user) return;
        const w = window as any;
        if (w.flutter_inappwebview?.callHandler) {
          w.flutter_inappwebview.callHandler(
            "registerFcm",
            JSON.stringify({
              userId: session.user.id,
              accessToken: session.access_token,
            })
          );
        }
      } catch (_) {}
    };
    send();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      send();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}