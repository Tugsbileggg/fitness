"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard";
}

/** URL-ийн #access_token, #refresh_token-оос session үүсгээд `next` руу шилжинэ. */
export function HashSessionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [failed, setFailed] = useState(false);
  // StrictMode (dev) effect-ийг хоёр удаа ажиллуулдаг; hash-ийг эхний удаа л уншиж арилгана.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    // Токеныг хаягийн мөрөөс (түүх, дэлгэцийн зураг) шууд арилгана.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (hash.get("error") || !accessToken || !refreshToken) {
      queueMicrotask(() => setFailed(true));
      return;
    }
    createClient()
      .auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) setFailed(true);
        else router.replace(safeNext(searchParams.get("next")));
      });
  }, [router, searchParams]);

  if (failed) {
    return (
      <div className="space-y-3 text-center">
        <p className="font-medium">Холбоосны хугацаа дууссан эсвэл буруу байна.</p>
        <p className="text-sm text-muted-foreground">
          Урилга бол менежерээсээ дахин илгээхийг хүснэ үү. Бүртгэлтэй бол нууц үгээ сэргээж болно.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Нэвтрэх хуудас руу
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
      Нэвтэрч байна…
    </div>
  );
}
