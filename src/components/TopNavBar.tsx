"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopNavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setIsAuthenticated(!!data.user);
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkSession();
  }, []);

  return (
    <nav className="bg-black text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">metrohedron</h1>
        <div >
          {isAuthenticated === false && (
            <Link
              href="/auth/login?prompt=login"
              className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-700"
            >
              Log In / Sign Up
            </Link>
          )}
          {isAuthenticated === true && (
            <div className="flex items-center space-x-4">
              <Link href="/log-trip" className="text-white hover:underline">
                Log Trip
              </Link>
              <Link href="/profile" className="text-white hover:underline">
                Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
