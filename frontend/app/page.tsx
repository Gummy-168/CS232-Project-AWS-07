"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<string>("ยังไม่ได้ทดสอบ");
  const [loading, setLoading] = useState<boolean>(false);

  const testBackend = async () => {
    try {
      setLoading(true);
      setResult("กำลังทดสอบ...");

      const res = await fetch("http://localhost:8000/api/db-test");
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.detail || "Something went wrong"}`);
        return;
      }

      setResult(`สำเร็จ: ${data.message}`);
    } catch (error) {
      setResult("เชื่อมต่อ backend ไม่ได้");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg p-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-4">
          Frontend Test Page
        </h1>

        <p className="text-zinc-600 mb-6">
          ใช้หน้านี้สำหรับทดสอบว่า Frontend สามารถเรียก FastAPI Backend ได้หรือไม่
        </p>

        <button
          onClick={testBackend}
          disabled={loading}
          className="rounded-xl bg-black text-white px-5 py-3 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ Backend"}
        </button>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500 mb-2">ผลลัพธ์</p>
          <p className="text-base font-medium text-zinc-900">{result}</p>
        </div>
      </div>
    </main>
  );
}