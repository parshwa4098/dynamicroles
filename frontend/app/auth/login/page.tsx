/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FaChartLine,
  FaEnvelope,
  FaLock,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

const getToken = () => {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("token");
  return t && t !== "undefined" ? t : null;
};

const getUser = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw || raw === "undefined") return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const isAuthenticated = () => {
  return getToken() && getUser();
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {

    const checkAuth = () => {
      if (isAuthenticated()) {
        router.replace("/dashboard");
      } else {
        setIsCheckingAuth(false);
      }
    };


    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [router]);

  
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("token", data.data.access_token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black p-4">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full">
        <div className="flex-1 text-white space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              User Management System
            </h1>
            <p className="text-lg">
              A powerful platform to manage your team efficiently
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <FaUsers className="text-2xl text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">User Management</h3>
                <p className="text-sm">
                  Add, edit, and manage users with different roles (Admin,
                  Manager, Employee)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-pink-500/20 p-3 rounded-lg">
                <FaShieldAlt className="text-2xl text-pink-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Role-Based Access
                </h3>
                <p className="text-sm">
                  Secure authentication with role-based permissions and access
                  control
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FaChartLine className="text-2xl text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Analytics Dashboard
                </h3>
                <p className="text-sm">
                  Track user statistics, pending approvals, and revenue metrics
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:w-96 w-full">
          <div className="bg-black border border-gray-800 p-8 rounded-2xl shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 text-center text-white">
              Login to Your Account
            </h2>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-center text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm mb-1 block text-white">Email</label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-lg bg-black text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm mb-1 block text-white">Password</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-10 border border-gray-700 rounded-lg bg-black text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg cursor-pointer font-medium transition-colors disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-white">
                Don&apos;t have an account?{" "}
                <span
                  className="text-purple-500 cursor-pointer hover:text-purple-400"
                  onClick={() => router.push("/auth/register")}
                >
                  Register
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}