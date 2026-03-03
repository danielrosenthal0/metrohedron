"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import TopNavBar from "@/components/TopNavBar";
import BottomBar from "@/components/BottomBar";

const MapLine = dynamic(() => import("@/components/MapLine"), { ssr: false });

export default function Home() {
  const [session, setSession] = useState<{ user?: { name?: string } } | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const sessionRes = await fetch("/api/auth",{
      credentials: 'include'
    });
        const sessionData = await sessionRes.json();
        setSession(sessionData);

        if (sessionData?.user) {
          await fetch("/api/auth/post-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include'
          });
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    }

    checkSession();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNavBar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Track Your NYC Subway Journeys
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Log trips and see your journeys across the  MTA
            </p>
          </div>

          {session && session.user ? (
            <div className="space-y-8">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl">
                <MapLine></MapLine>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:border-blue-500">
                <h2 className="text-3xl font-bold mb-4 text-white">
                  Welcome back, {session.user.name}! 👋
                </h2>
                <p className="text-gray-300 mb-6 text-lg">
                  Ready to log your next subway adventure?
                </p>
                
                <Link 
                  href="/log-trip" 
                  className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95"
                >
                  Log a Trip →
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/profile" className="bg-gray-800 border border-gray-700 rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-lg cursor-pointer">
                  <div className="text-green-400 text-4xl mb-2">🚇</div>
                  <h3 className="text-white font-semibold text-lg mb-1">Recent Trips</h3>
                  <p className="text-gray-400 text-sm">View your journey history</p>
                </Link>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-lg">
                  <div className="text-purple-400 text-4xl mb-2">📊</div>
                  <h3 className="text-white font-semibold text-lg mb-1">Analytics (Coming Soon)</h3>
                  <p className="text-gray-400 text-sm">Discover your patterns</p>
                </div>

                {/* <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 transform transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-lg cursor-pointer">
                  <div className="text-yellow-400 text-4xl mb-2">🗺️</div>
                  <h3 className="text-white font-semibold text-lg mb-1">Map View</h3>
                  <p className="text-gray-400 text-sm">Visualize your routes</p>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-12 shadow-2xl transform transition-all duration-300 hover:scale-105 hover:border-blue-500">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🚇</div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Start Tracking Today
                  </h2>
                  <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                    Sign in to log your subway journeys, discover travel patterns, 
                    and become an MTA expert.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <a 
                    href="/auth/login?prompt=login" 
                    className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all duration-200 hover:scale-110 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95"
                  >
                    Get Started →
                  </a>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-12">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm transform transition-all duration-300 hover:bg-gray-800 hover:scale-105 hover:border-blue-400">
                  <div className="text-blue-400 text-3xl mb-3">⚡</div>
                  <h3 className="text-white font-semibold text-lg mb-2">Quick Logging</h3>
                  <p className="text-gray-400 text-sm">Log trips in seconds with our streamlined interface</p>
                </div>

                {/* <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm transform transition-all duration-300 hover:bg-gray-800 hover:scale-105 hover:border-purple-400">
                  <div className="text-purple-400 text-3xl mb-3">📈</div>
                  <h3 className="text-white font-semibold text-lg mb-2">Smart Insights</h3>
                  <p className="text-gray-400 text-sm">Analyze your travel patterns and optimize routes</p>
                </div> */}

                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm transform transition-all duration-300 hover:bg-gray-800 hover:scale-105 hover:border-blue-400">
                  <div className="text-green-400 text-3xl mb-3">🎯</div>
                  <h3 className="text-white font-semibold text-lg mb-2">Track Progress (Coming Soon)</h3>
                  <p className="text-gray-400 text-sm">See how many stations you&apos;ve visited</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomBar/>
    </div>
  );
}
