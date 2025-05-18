"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [session, setSession] = useState<{ user?: { name?: string } } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
        if (data && data.user) {
          fetch("/api/auth/post-login", { method: "POST" });
        }
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">metrohedron</h1>
          <nav>
            {session && session.user ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="hover:underline">
                  Profile
                </Link>
                <Link href="/auth/logout" className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800">
                  Logout
                </Link>
              </div>
            ) : (
              <Link href="/auth/login" className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">Hi, {session.user.name}!</h2>
            <p className="mb-4 text-black">Track your NYC subway journeys.</p>
            <Link href="/log-trip" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Log a Trip
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">metrohedron</h2>
            <p className="mb-4 text-black">Sign in to start tracking subway journeys.</p>
            <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}