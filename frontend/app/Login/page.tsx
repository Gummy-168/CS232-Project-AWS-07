"use client";

import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Login failed");
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        width: "100vw",
        minHeight: "100vh",
        margin: 0,
        padding: "40px",
        background:
          "radial-gradient(circle at 94% 8%, rgba(255, 210, 225, 0.55) 0 13px, transparent 14px), linear-gradient(135deg, #d8d0ef 0%, #edeae7 48%, #f2dce5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "125%",
          height: "180px",
          left: "-12%",
          bottom: "-82px",
          background: "rgba(255, 255, 255, 0.25)",
          borderRadius: "50%",
          transform: "rotate(-8deg)",
          zIndex: 0,
        }}
      />

      <section
        style={{
          width: "830px",
          height: "515px",
          maxWidth: "90vw",
          background: "#ffffff",
          borderRadius: "22px",
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "32px",
          }}
        >
          <img
            src="/logo/logo.png"
            alt="Askdemy Logo"
            style={{
              width: "315px",
              height: "auto",
              display: "block",
              objectFit: "contain",
            }}
          />

          <p
            style={{
              marginTop: "74px",
              marginBottom: "0",
              color: "#f654a0",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            Tiny question... Big clarity!
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: "18px",
              border: "none",
              outline: "none",
              background:
                "linear-gradient(90deg, #7652e8 0%, #d84fb2 100%)",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: 800,
              padding: "15px 40px",
              borderRadius: "999px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 8px rgba(119, 84, 233, 0.28)",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Loading..." : "Login"}
          </button>
        </div>
      </section>
    </main>
  );
}