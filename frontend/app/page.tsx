"use client";

import Image from "next/image";
import { useState } from "react";
import { writeStoredSession } from "./lib/auth";

type LoginRole = "student" | "professor";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<LoginRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      setLoading(true);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:8000";

      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      const token = data.access_token || data.token;
      const role = (data.role as LoginRole | undefined) || selectedRole;

      if (token) {
        localStorage.setItem("token", token);
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          role,
          email,
          access_token: token,
        }),
      );

      // Keep compatibility with the route guards that read `askademy.session`.
      writeStoredSession({
        accessToken: token || "",
        tokenType: data.token_type || "session",
        role,
        userId: token || email,
        email,
        nickname: email.split("@")[0] || email,
      });

      window.location.href =
        role === "professor" ? "/professor/questions" : "/student/dashboard";
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/loginfillerlogo/loginbg.svg')" }}
    >
      <div className="w-[350px] bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center gap-5">
        <Image
          src="/loginfillerlogo/logo.svg"
          alt="Askdemy Logo"
          width={180}
          height={60}
          style={{ width: "auto", height: "auto" }}
          priority
        />

        <h2 className="text-lg text-black font-semibold">Welcome Back</h2>

        <div className="flex gap-5 justify-center w-full">
          <button
            type="button"
            onClick={() => setSelectedRole("student")}
            className={`w-24 py-2 rounded-3xl text-xs font-medium text-black transition-all duration-200 ${
              selectedRole === "student"
                ? "bg-[#D9D6D6]"
                : "bg-[#F0EDED] hover:bg-[#D9D6D6]"
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("professor")}
            className={`w-24 py-2 rounded-3xl text-xs font-medium text-black transition-all duration-200 ${
              selectedRole === "professor"
                ? "bg-[#D9D6D6]"
                : "bg-[#F0EDED] hover:bg-[#D9D6D6]"
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
                className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500"
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
                className="w-full pl-11 pr-4 py-2 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white font-semibold hover:brightness-110 hover:shadow-lg hover:shadow-[#513FDF]/30 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Loading..." : "Log in"}
        </button>

        <div className="text-sm text-black flex flex-col items-center">
          <span>If you don&apos;t have an account?</span>
          <span className="text-[#AE2466] font-bold cursor-pointer underline">
            Create account
          </span>
        </div>
      </div>
    </div>
  );
}
