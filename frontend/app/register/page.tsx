"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { registerUser } from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [id, setId] = useState("");
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const idLabel = "STUDENT ID";
  const idPlaceholder = "6700000000";
  const emailPlaceholder = "stu001@example.com";

  const isDisabled = useMemo(() => {
    return (
      loading ||
      !id.trim() ||
      !fullName.trim() ||
      !nickname.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    );
  }, [confirmPassword, email, fullName, id, loading, nickname, password]);

  async function handleRegister() {
    if (isDisabled) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Password and confirm password do not match");
      return;
    }

    setLoading(true);

    try {
      await registerUser({
        id: id.trim(),
        full_name: fullName.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        password,
        role: "student",
      });

      setSuccessMessage("Account created successfully. Redirecting to login...");
      window.setTimeout(() => {
        router.replace("/?role=student");
      }, 900);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message || "Register failed");
      } else {
        setErrorMessage("Cannot connect to backend");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-8"
      style={{ backgroundImage: "url('/loginfillerlogo/loginbg.svg')" }}
    >
      <div className="w-full max-w-[560px] bg-white rounded-3xl shadow-xl px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center gap-5">
        <Image
          src="/loginfillerlogo/logo.svg"
          alt="Askademy Logo"
          width={205}
          height={70}
          style={{ width: "auto", height: "auto" }}
          priority
        />

        <div className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#9D7BEE]">
            Student Only
          </p>
          <h2 className="mt-1 text-2xl font-bold bg-gradient-to-r from-[#513FDF] to-[#FD64A4] bg-clip-text text-transparent">
            Create Student Account
          </h2>
          <p className="text-sm text-[#6B6288] mt-1">
            Join Askademy with your classroom profile
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-black font-medium">{idLabel}</label>
            <input
              type="text"
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder={idPlaceholder}
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-black font-medium">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={emailPlaceholder}
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-black font-medium">FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="สมชาย ใจดี"
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-black font-medium">NICKNAME</label>
            <input
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Somchai"
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-black font-medium">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-black font-medium">CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-3 rounded-full bg-[#F0EDED] outline-none text-black placeholder:text-zinc-500 text-sm"
            />
          </div>
        </div>

        {errorMessage ? (
          <p className="w-full text-sm text-red-600 text-center">{errorMessage}</p>
        ) : null}

        {successMessage ? (
          <p className="w-full text-sm text-emerald-600 text-center">
            {successMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleRegister}
          disabled={isDisabled}
          className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#513FDF] to-[#FD64A4] text-white font-semibold text-base hover:brightness-110 hover:shadow-lg hover:shadow-[#513FDF]/30 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <div className="text-sm text-black flex flex-col items-center">
          <span>Already have an account?</span>
          <Link href="/" className="text-[#AE2466] font-bold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
