"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";
import { buildSessionFromLogin, loginUser } from "../lib/api";
import {
  clearStoredSession,
  getDefaultRouteByRole,
  readStoredSession,
  writeStoredSession,
  type UserRole,
} from "../lib/auth";

type LoginRole = UserRole;

function LoginPageContent() {
  const router = useRouter();
  const oidc = useAuth();
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8000";
  const isCognitoConfigured = Boolean(
    process.env.NEXT_PUBLIC_COGNITO_AUTHORITY &&
      process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID &&
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI &&
      process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI,
  );
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCognitoSyncing, setIsCognitoSyncing] = useState(false);

  const isDisabled = useMemo(() => {
    return loading || !email.trim() || !password.trim();
  }, [email, loading, password]);

  useEffect(() => {
    const role = searchParams.get("role");
    if (role === "student" || role === "professor") {
      setSelectedRole(role);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = oidc.user?.access_token || oidc.user?.id_token;
    if (!oidc.isAuthenticated || !token || readStoredSession()) {
      return;
    }

    const syncUser = async () => {
      setIsCognitoSyncing(true);
      setErrorMessage("");
      try {
        const meResponse = await fetch(`${apiBaseUrl}/api/auth/cognito/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meResponse.ok) {
          throw new Error("Failed to validate Cognito token");
        }
        const me = (await meResponse.json()) as {
          sub: string;
          email: string;
          username: string;
        };

        const roleFromState = (
          oidc.user?.state as { selectedRole?: UserRole } | undefined
        )?.selectedRole;
        const cognitoRole: UserRole =
          roleFromState === "professor" ? "professor" : "student";

        const syncResponse = await fetch(`${apiBaseUrl}/api/auth/cognito/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            role: cognitoRole,
            nickname: me.username,
          }),
        });

        if (!syncResponse.ok) {
          throw new Error("Failed to sync Cognito user");
        }

        const synced = (await syncResponse.json()) as {
          user_id: string;
          role: UserRole;
        };

        writeStoredSession({
          accessToken: token,
          tokenType: "bearer",
          role: synced.role,
          userId: synced.user_id,
          email: me.email || `${synced.user_id}@cognito.local`,
          fullName: me.username || synced.user_id,
          nickname: me.username || synced.user_id,
        });

        router.replace(getDefaultRouteByRole(synced.role));
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Cognito login failed");
        }
      } finally {
        setIsCognitoSyncing(false);
      }
    };

    void syncUser();
  }, [apiBaseUrl, oidc.isAuthenticated, oidc.user, router]);

  async function handleLogin() {
    if (isDisabled) {
      return;
    }

    clearStoredSession();
    setErrorMessage("");
    setLoading(true);

    try {
      const payload = {
        email: email.trim(),
        password,
        role: selectedRole,
      };
      const login = await loginUser(payload);
      const role = login.role || selectedRole;
      const session = buildSessionFromLogin({ ...login, role }, payload);

      writeStoredSession(session);
      router.replace(login.redirect_to || getDefaultRouteByRole(session.role));
    } catch (error) {
      clearStoredSession();
      if (error instanceof Error) {
        setErrorMessage(error.message || "Login failed");
      } else {
        setErrorMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: "url('/loginfillerlogo/loginbg.svg')" }}
    >
      <div className="w-full max-w-[490px] bg-white rounded-3xl shadow-xl px-10 py-12 flex flex-col items-center gap-6">
        <Image
          src="/loginfillerlogo/logo.svg"
          alt="Askademy Logo"
          width={220}
          height={75}
          style={{ width: "auto", height: "auto" }}
          priority
        />

        <h2 className="text-xl text-black font-semibold">Welcome Back</h2>

        <div className="flex gap-5 justify-center w-full">
          <button
            type="button"
            onClick={() => setSelectedRole("student")}
            className={`w-28 py-2.5 rounded-3xl text-sm font-semibold transition-all duration-200 ${
              selectedRole === "student"
                ? "bg-[#513FDF] text-white shadow-md shadow-[#513FDF]/30"
                : "bg-[#F0EDED] text-[#444] hover:bg-[#E5E1FF] hover:text-[#3F30BF]"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("professor")}
            className={`w-28 py-2.5 rounded-3xl text-sm font-semibold transition-all duration-200 ${
              selectedRole === "professor"
                ? "bg-[#FD64A4] text-white shadow-md shadow-[#FD64A4]/30"
                : "bg-[#F0EDED] text-[#444] hover:bg-[#FFE5F0] hover:text-[#C13A76]"
            }`}
          >
            Professor
          </button>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div>
            <label className="text-xs text-black font-medium">EMAIL</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Image
                  src="/loginfillerlogo/profile.svg"
                  alt="User Icon"
                  width={20}
                  height={20}
                />
              </div>
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="stu001@example.com"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-black font-medium">PASSWORD</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Image
                  src="/loginfillerlogo/lock.svg"
                  alt="Lock Icon"
                  width={12}
                  height={12}
                />
              </div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
              />
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p className="w-full text-sm text-red-600 text-center">{errorMessage}</p>
        ) : null}

        <button
          type="button"
          onClick={handleLogin}
          disabled={isDisabled}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white font-semibold text-base hover:brightness-110 hover:shadow-lg hover:shadow-[#513FDF]/30 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Loading..." : "Login with existing account"}
        </button>

        <button
          type="button"
          onClick={() => oidc.signinRedirect({ state: { selectedRole } })}
          disabled={!isCognitoConfigured || oidc.isLoading || isCognitoSyncing}
          className="w-full py-3.5 rounded-full border border-[#513FDF] text-[#513FDF] font-semibold text-base hover:bg-[#F5F3FF] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isCognitoSyncing ? "Syncing Cognito account..." : "Login with Cognito"}
        </button>

        <div className="text-sm text-black flex flex-col items-center">
          <span>If you do not have an account?</span>
          <Link
            href="/register"
            className="text-[#AE2466] font-bold hover:underline"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading login...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
