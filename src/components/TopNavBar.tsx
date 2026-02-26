"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopNavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth", {
          credentials: 'include'
        });
        const data = await res.json();
        setIsAuthenticated(!!data.user);
      } catch (error) {
        console.error('NavBar: Session check failed:', error);
        setIsAuthenticated(false);
      }
    }
    
    checkSession();

  }, []);

  return (
    <nav className="bg-gray-800 border-b border-gray-700 text-white p-4 shadow-lg backdrop-blur-sm bg-opacity-95 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          href="/" 
          className="text-2xl font-bold transition-all duration-200 hover:text-blue-400 hover:scale-105 transform"
        >
          metrohedron
        </Link>

        <div>
          {isAuthenticated === false && (
            <Link
              href="/auth/login?prompt=login"
              className="text-white bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 rounded-lg font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95"
            >
              Log In / Sign Up
            </Link>
          )}
          {isAuthenticated === true && (
            <div className="flex items-center space-x-6">
              <Link 
                href="/log-trip" 
                className="text-gray-300 hover:text-white font-semibold transition-all duration-200 hover:scale-105 transform relative group"
              >
                Log Trip
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
              <Link 
                href="/profile" 
                className="text-gray-300 hover:text-white font-semibold transition-all duration-200 hover:scale-105 transform relative group"
              >
                Profile
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-200 group-hover:w-full"></span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
