"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import TopNavBar from "@/components/TopNavBar";

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
    <div className="min-h-screen bg-black ">
<TopNavBar />

      <main className="container mx-auto p-4 flex flex-col justify-center items-center">
        {session && session.user ? (
          <div className="bg-black-300 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Hi, {session.user.name}!</h2>
            <p className="mb-4 text-white">Track your NYC subway journeys.</p>
            <Link href="/log-trip" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Log a Trip
            </Link>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">metrohedron</h2>
            <p className="mb-4 text-white">Sign in to start tracking subway journeys.</p>
            <Link href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Get Started
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}