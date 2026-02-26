"use client"

import TopNavBar from "@/components/TopNavBar";
import 'leaflet/dist/leaflet.css';
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import dynamic from 'next/dynamic';
import { Station } from "@prisma/client";

const Map = dynamic(() => import('@/components/Map'), { ssr: false });
interface Line {
  id: string;
  name: string;
  color: string;
}

function normalizeStationKey(name?: string) {
  return (name || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/-/g, " ")
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, "$1")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bstation\b/g, " ")
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "av")
    .replace(/\bsq\b/g, "square")
    .replace(/\s+/g, " ")
    .trim();
}


function SetFavoriteLineModal({isOpen, onClose, onSubmit}: {isOpen: boolean; onClose: () => void; onSubmit: (lineId: string) => void;}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLine, setSelectedLine] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetch('/api/lines')
        .then((res) => res.json())
        .then((data) => setLines(data))
        .catch((error) => console.error('Error fetching lines:', error));
    }
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6 text-white">Set Favorite Line</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(selectedLine);
          onClose();
        }}>
          <select
            value={selectedLine}
            onChange={(e) => setSelectedLine(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4"
            required
          >
            <option value="">Select a line</option>
            {lines.map(line => (
              <option key={line.id} value={line.id}>
                {line.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedLine}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default function Profile() {
    const [modalOpen, setModalOpen] = useState(false);
    const [session, setSession] = useState<{ user?: { name?: string; sub?: string } } | null>(null);
    type Trip = {
      id: string;
      line: Line;
      createdAt: string;
      startStation: Station;
      endStation: Station;
      tripDate: string;
    };
    type UserData = {
      id: string;
      name?: string;
      trips?: Trip[];
      favoriteLines?: Line[];
    };
    const [userData, setUserData] = useState<UserData | null>(null);

    const journeys = useMemo(() => {
      if (!userData?.trips || userData.trips.length === 0) return [];

      const sortedTrips = [...userData.trips].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const groups: Trip[][] = [];
      const maxGapMs = 30_000;

      sortedTrips.forEach((trip) => {
        const lastGroup = groups[groups.length - 1];
        if (!lastGroup) {
          groups.push([trip]);
          return;
        }

        const lastSegment = lastGroup[lastGroup.length - 1];
        const sameTripDate = trip.tripDate.slice(0, 10) === lastSegment.tripDate.slice(0, 10);
        const closeInTime =
          Math.abs(new Date(trip.createdAt).getTime() - new Date(lastSegment.createdAt).getTime()) <= maxGapMs;
        const chainsWithPrevious =
          lastSegment.endStation.id === trip.startStation.id ||
          normalizeStationKey(lastSegment.endStation.name) === normalizeStationKey(trip.startStation.name);

        if (sameTripDate && closeInTime && chainsWithPrevious) {
          lastGroup.push(trip);
        } else {
          groups.push([trip]);
        }
      });

      return groups.sort((a, b) => {
        const aLast = a[a.length - 1];
        const bLast = b[b.length - 1];
        return new Date(bLast.createdAt).getTime() - new Date(aLast.createdAt).getTime();
      });
    }, [userData?.trips]);

    useEffect(() => {
        async function fetchData() {
            try {
                const sessionRes = await fetch("/api/auth", {
      credentials: 'include'
    });
                const sessionData = await sessionRes.json();
                setSession(sessionData);
                
                if (sessionData?.user?.sub) {
                    const userRes = await fetch(`/api/user/${sessionData.user.sub}`);
                    const userData = await userRes.json();
                    setUserData(userData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        }

        fetchData();
    }, []);

    const handleAddFavoriteLine = async (lineId: string) => {
    if (!session?.user?.sub) return;

    try {
      const response = await fetch(`/api/user/${session.user.sub}/favorite-line`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lineId, auth0Id: session?.user?.sub }),
      });

      if (response.ok) {
        // refresh user to show new fav line
        const updatedUserData = await fetch(`/api/user/${session.user.sub}`).then(res => res.json());
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('Error adding favorite line:', error);
    }
  };
  return (
    <div className="min-h-screen bg-gray-900">
      <TopNavBar />

      <main className="container mx-auto px-4 py-8">
        {session && session.user ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl p-8 shadow-xl">
              <h1 className="text-4xl font-bold text-white mb-2">
                Hi, {session.user.name}! 👋
              </h1>
              <p className="text-gray-400">Your subway journey dashboard</p>
            </div>

            {userData ? (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      🚇 Your Trips
                      <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                        {journeys.length || 0}
                      </span>
                    </h2>
                    <Link
                      href="/log-trip"
                      className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                    >
                      + Log New Trip
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {journeys.length > 0 ? (
                      journeys.map((journey, journeyIndex) => {
                        const firstSegment = journey[0];
                        const lastSegment = journey[journey.length - 1];
                        const journeyStart: [number, number] = [firstSegment.startStation.latitude, firstSegment.startStation.longitude];
                        const journeyEnd: [number, number] = [lastSegment.endStation.latitude, lastSegment.endStation.longitude];
                        return (
                        <div
                          className="bg-gray-900 border border-gray-700 rounded-xl p-6 transform transition-all duration-300 hover:scale-102 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10"
                          key={`${firstSegment.id}-${lastSegment.id}-${journeyIndex}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">📍</div>
                              <div>
                                <p className="text-white font-semibold text-lg">
                                  {firstSegment.startStation.name} → {lastSegment.endStation.name}
                                </p>
                                <p className="text-gray-400 text-sm">
                                  {new Date(firstSegment.tripDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  {journey.length > 1 ? ` • ${journey.length} segments` : ''}
                                </p>
                              </div>
                            </div>
                            <div className="text-gray-500">→</div>
                          </div>
                          <Map 
                            center={[(journeyStart[0] + journeyEnd[0]) / 2, (journeyStart[1] + journeyEnd[1]) / 2]} 
                            zoom={13}
                            startStationCoord={journeyStart}
                            endStationCoord={journeyEnd}
                            segments={journey.map((segment) => ({
                              lineId: segment.line.id,
                              lineName: segment.line.name,
                              lineColor: segment.line.color,
                              startStationCoord: [segment.startStation.latitude, segment.startStation.longitude] as [number, number],
                              endStationCoord: [segment.endStation.latitude, segment.endStation.longitude] as [number, number],
                            }))}
                          />
                        </div>
                      )})
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🚇</div>
                        <p className="text-gray-400 mb-4">No trips logged yet</p>
                        <Link
                          href="/log-trip"
                          className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50"
                        >
                          Log Your First Trip
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white  flex items-center gap-2">
                    ⭐ Favorite Lines
                    <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
                      {userData.favoriteLines?.length || 0}
                    </span>
                  </h2>
                    <div className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200" onClick={() => setModalOpen(true)}
                    >
                      + Add Favorite Line
                    </div>
                    <SetFavoriteLineModal isOpen={modalOpen} onClose={() => setModalOpen(false)}  onSubmit={handleAddFavoriteLine}/>
                  </div>
                  <div className="space-y-3">
                    {userData.favoriteLines && userData.favoriteLines.length > 0 ? (
                      userData.favoriteLines.map((line) => (
                        <div
                          key={line.id}
                          className="bg-gray-900 border border-gray-700 rounded-lg px-6 py-4 transform transition-all duration-300 hover:scale-102 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/10"
                        >
                          <p className="text-white font-semibold text-lg flex items-center gap-2">
                            <span className="text-yellow-400">★</span>
                            {line.name}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No favorite lines yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                        try {
                            const res = await fetch('/api/auth/logout', {
                                method: 'POST',
                                credentials: 'include'
                            });
                            if (res.ok) {
                                window.location.href = '/';
                            }
                        } catch (error) {
                            console.error('Logout failed:', error);
                        }
                    }}
                    className="text-white bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 rounded-lg font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-red-500/50 hover:from-red-500 hover:to-red-400 active:scale-95"
                >
                    Log Out
                </button>
                </div>
              </>
            ) : (
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-12 shadow-xl text-center">
                <div className="animate-pulse">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-400 text-lg">Loading your profile...</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
