"use client";

import TopNavBar from "@/components/TopNavBar"
import { useState, useEffect } from "react";

interface Trip {
  startStation: string;
  endStation: string;
  line: string;
  startTime: string;
  endTime: string;
}

interface Line {
  name: string;
  id: string;
  stations: { id: string; name: string }[];
}

function AddTripModal({ isOpen, onClose, onSubmit, stations, lines }: { isOpen: boolean, onClose: () => void, onSubmit: (trip: Trip) => void, stations: { id: string, name: string }[], lines: Line[] }) {
  const [startStation, setStartStation] = useState("");
  const [endStation, setEndStation] = useState("");
  const [line, setLine] = useState("");
  const [filteredStations, setFilteredStations] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (line) {
      const selectedLine = lines.find(l => l.id === line);
      setFilteredStations(selectedLine ? selectedLine.stations : []);
    } else {
      // If no line is selected, clear the available stations
      setFilteredStations([]);
    }
  }, [line, lines]);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const nowStr = `${todayStr}T${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  const [startTime, setStartTime] = useState(nowStr);
  const [endTime, setEndTime] = useState("");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-black">Add Trip</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit({ startStation, endStation, line, startTime, endTime });
            setStartStation(""); setEndStation(""); setLine(""); setStartTime(""); setEndTime("");
            onClose();
          }}
        >
          <div className="mb-2">
            <label className="block text-gray-700">Line</label>
            <select className="w-full border rounded p-2 text-black" value={line} onChange={e => setLine(e.target.value)} required >
              <option value="">Select a line</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-gray-700">Start Station</label>
            <select className="w-full border rounded p-2 text-black" value={startStation} onChange={e => setStartStation(e.target.value)} required>
              <option value="">Select a station</option>
              {filteredStations.map(station => (
                <option key={station.id} value={station.name}>{station.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-gray-700">End Station</label>
            <select className="w-full border rounded p-2 text-black" value={endStation} onChange={e => setEndStation(e.target.value)} required>
              <option value="">Select a station</option>
              {stations.map(station => (
                <option key={station.id} value={station.name}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label className="block text-gray-700">Start Time</label>
            <input type="datetime-local" className="w-full border rounded p-2 text-black" value={startTime} onChange={e => setStartTime(e.target.value)} min={`${todayStr}T00:00`} max={`${todayStr}T23:59`} required />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">End Time</label>
            <input type="datetime-local" className="w-full border rounded p-2 text-black" value={endTime} onChange={e => setEndTime(e.target.value)} min={startTime} max={`${todayStr}T23:59`}/>
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" className="px-4 py-2 bg-red-600 rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
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
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/stations")
      .then(res => res.json())
      .then(data => setStations(data))
      .catch(() => setStations([]));
  }, []);

  useEffect(() => {
    fetch("http://localhost:4000/lines")
      .then(res => res.json())
      .then(data => setLines(data))
      .catch(() => setLines([]));
  }, []);

  function handleAddTrip(trip: Trip) {
    fetch("http://localhost:4000/new-trip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trip: {
          startStation: trip.startStation,
          endStation: trip.endStation,
          lineId: trip.line,
          startTime: trip.startTime ? new Date(trip.startTime).toISOString() : undefined,
          endTime: trip.endTime ? new Date(trip.endTime).toISOString() : undefined,
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
    <div className="min-h-screen bg-black ">
      <TopNavBar/>
      <div className="container mx-auto p-4 flex flex-col justify-center items-center">
        <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setModalOpen(true)}>
          Add Trip Manually
        </button>
        <AddTripModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleAddTrip} stations={stations} lines={lines}/>
          <button className="mb-4 px-4 py-2 bg-blue-600 text-white rounded">
            Start Automatic Tracking
          </button>
      </div>
    </div>
  )
}