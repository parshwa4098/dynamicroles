/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaUserTag,
} from "react-icons/fa";
import { toast } from "react-toastify";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
  const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);
  const validatePassword = (password: string) =>
    /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(password);

  const handleSignup = async () => {
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!validatePassword(password)) {
      setError(
        "Password must be at least 6 characters and contain letters and numbers",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role_id: 40,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      toast.success("Registered successfully!");
      router.push("/auth/login");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black p-4">
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full">
        <div className="flex-1 text-white space-y-6">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 ">
              Join Our Platform
            </h1>
            <p className=" text-lg">
              Create your account and start managing your team today
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-green-500/20 p-3 rounded-lg">
                <FaCheckCircle className="text-2xl text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Quick Setup</h3>
                <p className=" text-sm">
                  Get started in minutes with our simple registration process
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <FaUserTag className="text-2xl text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Choose Your Role</h3>
                <p className=" text-sm">
                  Select the role that best fits your responsibilities
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800">
              <div className="bg-blue-500/20 p-3 rounded-lg">
                <FaLock className="text-2xl text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Secure & Safe</h3>
                <p className=" text-sm">
                  Your data is protected with industry-standard security
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:w-96 w-full bg-black border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-white">
            Create an Account
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-center text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm mb-1 block text-white">Full Name</label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-700 rounded-lg bg-black text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm mb-1 block text-white">Email</label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
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
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-700 rounded-lg bg-black text-white"
                />
              </div>
              <p className="text-xs text-white mt-1">
                Min 6 characters with letters and numbers
              </p>
            </div>

            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full bg-purple-600 text-white p-3 rounded-lg cursor-pointer font-medium"
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </div>

          <div className="mt-6 text-center text-white/80 text-sm">
            Already have an account?{" "}
            <span
              className="text-purple-500 cursor-pointer"
              onClick={() => router.push("/auth/login")}
            >
              Login
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
