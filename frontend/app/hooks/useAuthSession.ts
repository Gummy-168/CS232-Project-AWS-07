"use client";

import { useEffect, useState } from "react";
import {
  getAuthEventName,
  readStoredSession,
  type AuthSession,
} from "../lib/auth";

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const syncSession = () => {
      setSession(readStoredSession());
      setIsHydrated(true);
    };

    syncSession();

    const authEventName = getAuthEventName();
    window.addEventListener("storage", syncSession);
    window.addEventListener(authEventName, syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener(authEventName, syncSession);
    };
  }, []);

  return {
    session,
    isHydrated,
  };
}
