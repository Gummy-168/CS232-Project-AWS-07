"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDefaultRouteByRole, type UserRole } from "../lib/auth";
import { useAuthSession } from "../hooks/useAuthSession";

interface AuthGuardProps {
  children: ReactNode;
  allowedRole: UserRole;
}

export default function AuthGuard({
  children,
  allowedRole,
}: AuthGuardProps) {
  const router = useRouter();
  const { session, isHydrated } = useAuthSession();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!session) {
      router.replace("/");
      return;
    }

    if (session.role !== allowedRole) {
      router.replace(getDefaultRouteByRole(session.role));
    }
  }, [allowedRole, isHydrated, router, session]);

  if (!isHydrated || !session || session.role !== allowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FE] text-slate-500">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
