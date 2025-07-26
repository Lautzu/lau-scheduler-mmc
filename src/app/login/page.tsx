"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthUtils } from "@/lib/auth";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // For migration period, support legacy password
      const isValidLegacy = await AuthUtils.validateLegacyPassword(password);

      if (isValidLegacy) {
        // Create a temporary session for legacy login
        // In production, this should be replaced with proper Supabase auth
        sessionStorage.setItem(
          "loginData",
          JSON.stringify({
            isLoggedIn: true,
            timestamp: Date.now(),
            legacy: true,
          }),
        );

        router.push("/scheduler");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mmc-blue to-mmc-dark-blue p-5">
      <div className="bg-white p-12 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/Makati_Medical_Center_Logo.png"
            alt="Makati Medical Center"
            width={200}
            height={100}
            className="mx-auto mb-6"
            priority
          />
          <h1 className="text-mmc-blue text-3xl font-bold mb-2">
            Makati Medical Center
          </h1>
          <p className="text-gray-600 text-base">
            Staff Scheduler - Pulmonary Laboratory Division
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="password"
              className="block text-gray-700 font-semibold text-sm mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-3 py-4 border-2 border-gray-200 rounded-lg text-base transition-all duration-300 focus:border-mmc-blue focus:outline-none focus:bg-white bg-gray-50"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center p-3 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-mmc-blue to-mmc-dark-blue text-white py-4 rounded-lg text-base font-semibold transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
