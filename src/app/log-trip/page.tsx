"use client";

import TopNavBar from "@/components/TopNavBar"
import { useState, useEffect } from "react";

interface Trip {
  startStationId: string;
  endStationId: string;
  line: string;
  tripDate: Date;
}

interface Line {
  name: string;
  id: string;
  stations: { id: string; name: string }[];
}

interface Station {
  name: string;
  id: string
}

function AddTripModal({ isOpen, onClose, onSubmit, lines }: { isOpen: boolean, onClose: () => void, onSubmit: (trip: Trip) => void, stations: Station[], lines: Line[] }) {
  const [startStation, setStartStation] = useState("");
  const [endStation, setEndStation] = useState("");
  const [line, setLine] = useState("");
  const [filteredStations, setFilteredStations] = useState<{ id: string; name: string }[]>([]);
  
  useEffect(() => {
    if (line) {
      const selectedLine = lines.find(l => l.id === line);
      setFilteredStations(selectedLine ? selectedLine.stations : []);
    } else {
      setFilteredStations([]);
    }
  }, [line, lines]);

  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const [tripDate, setTripDate] = useState(todayString);
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-2xl font-bold mb-6 text-white">Add New Trip 🚇</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit({ startStationId: startStation, endStationId: endStation, line, tripDate: new Date(tripDate) });
            setStartStation(""); setEndStation(""); setLine(""); setTripDate(todayString);
            onClose();
          }}
        >
          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Line</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
              value={line} 
              onChange={e => setLine(e.target.value)} 
              required
            >
              <option value="">Select a line</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">Start Station</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              value={startStation} 
              onChange={e => setStartStation(e.target.value)} 
              disabled={!line}
              required
            >
              <option value="">Select a station</option>
              {filteredStations.map(station => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 font-semibold mb-2">End Station</label>
            <select 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
              value={endStation} 
              onChange={e => setEndStation(e.target.value)} 
              disabled={!line}
              required
            >
              <option value="">Select a station</option>
              {filteredStations.map(station => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 font-semibold mb-2">Trip Date</label>
            <input 
              type="date" 
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors" 
              value={tripDate} 
              onChange={e => setTripDate(e.target.value)} 
              required 
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold transform transition-all duration-200 hover:bg-gray-600 hover:scale-105 active:scale-95" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95"
            >
              Add Trip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LogTrip() {
  const [modalOpen, setModalOpen] = useState(false);
  const [stations, setStations] = useState<{ id: string, name: string }[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [session, setSession] = useState<{ user?: { name?: string; sub?: string } } | null>(null);

  useEffect(() => {
    fetch("/api/auth", {
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/stations`)
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(() => setStations([]));
  }, []);

  useEffect(() => {
    fetch(`/api/lines`)
      .then(res => res.json())
      .then(data => setLines(data))
      .catch(() => setLines([]));
  }, []);

  function handleAddTrip(trip: Trip) {
    fetch(`/api/new-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trip: {
          startStationId: trip.startStationId,
          endStationId: trip.endStationId,
          lineId: trip.line,
          tripDate: trip.tripDate,
        },
        auth0Id: session?.user?.sub || "",
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("Trip added:", data);
      })
      .catch(err => {
        console.error("Error adding trip:", err);
      });
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNavBar/>
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Log Your Trip 📍
            </h1>
            <p className="text-xl text-gray-400">
              Track your NYC subway journeys
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:border-blue-500">
              <div className="flex items-start gap-4">
                <div className="text-4xl">✏️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">Manual Entry</h2>
                  <p className="text-gray-400 mb-6">
                    Quickly log a trip by selecting your line and stations
                  </p>
                  <button 
                    className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold shadow-md transform transition-all duration-200 hover:scale-105 hover:shadow-blue-500/50 hover:from-blue-500 hover:to-blue-400 active:scale-95" 
                    onClick={() => setModalOpen(true)}
                  >
                    Add Trip Manually
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 shadow-xl opacity-60 cursor-not-allowed">
              <div className="flex items-start gap-4">
                <div className="text-4xl">📱</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Automatic Tracking
                    <span className="ml-3 text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full">Coming Soon</span>
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Let the app automatically detect and log your subway trips
                  </p>
                  <button 
                    className="bg-gray-700 text-gray-500 px-6 py-3 rounded-xl font-semibold cursor-not-allowed" 
                    disabled
                  >
                    Start Automatic Tracking
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              💡 Quick Tips
            </h3>
            <ul className="space-y-2 text-gray-300 text-sm">
 
              <li className="flex items-center gap-2 mt-1">
                <span className="text-blue-400 ">•</span>
                <span>Select the line first to see available stations</span>
              </li>
              <li className="flex items-center gap-2 mt-1">
                <span className="text-blue-400 ">•</span>
                <span>View all your trips in your profile</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <AddTripModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={handleAddTrip} 
        stations={stations} 
        lines={lines}
      />
    </div>
  )
}