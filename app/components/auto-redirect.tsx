"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRedirect({ href, delayMs }: { href: string; delayMs: number }) {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push(href), delayMs);
    return () => clearTimeout(timer);
  }, [router, href, delayMs]);

  return null;
}
