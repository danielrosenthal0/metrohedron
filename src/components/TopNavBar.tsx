"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function TopNavBar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth", {
          credentials: 'include'
        });
        const data = await res.json();
        console.log("session check response: ", data);
        setIsAuthenticated(!!data.user);
      } catch (error) {
        console.error('Session check failed:', error);
        setIsAuthenticated(false);
      }
    }

    checkSession();
  }, [pathname]);

  const handleNavigate = async (path: string) => {
    if (isAuthenticated) {
      router.push(path);
    } else {
      router.push('/auth/login?prompt=login');
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 text-white p-4 shadow-lg backdrop-blur-sm bg-opacity-95 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <button 
          onClick={() => router.push('/')}
          className="text-2xl font-bold transition-all duration-200 hover:text-blue-400 hover:scale-105 transform"
        >
          metrohedron
        </button>

        <div>
          {isAuthenticated === false && (
            <button
              onClick={() => router.push('/auth/login?prompt=login')}
              className="text-white bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-2 rounded-lg font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95"
            >
              Log In / Sign Up
            </button>
          )}
          {isAuthenticated === true && (
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleNavigate('/log-trip')}
                className={`text-gray-300 hover:text-white transition-colors ${
                  pathname === "/log-trip" ? "text-white" : ""
                }`}
              >
                Log Trip
              </button>
              <button
                onClick={() => handleNavigate('/profile')}
                className={`text-gray-300 hover:text-white transition-colors ${
                  pathname === "/profile" ? "text-white" : ""
                }`}
              >
                Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}