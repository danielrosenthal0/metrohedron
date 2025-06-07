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
    <nav className="bg-slate-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">metrohedron</h1>
        <div >
         
          {isAuthenticated === false && (
            <Link
              href="/auth/login"
              className="text-white bg-blue-500 px-3 py-1 rounded hover:bg-blue-700"
            >
              Log In / Sign Up
            </Link>
          )}
          {isAuthenticated === true && (
            <div className="flex items-center space-x-4">

              <Link href="/" className="text-white hover:underline">
              Home
              </Link>
              <Link href="/profile" className="text-white hover:underline">
                Profile
              </Link>
              <Link href="/log-trip" className="text-white hover:underline">
                Log Trip
              </Link>
              <Link
                href="/auth/logout"
                className="text-white bg-red-500 px-3 py-1 rounded hover:bg-red-700"
              >
                Log Out
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
