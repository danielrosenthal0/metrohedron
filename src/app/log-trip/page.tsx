"use client";

import TopNavBar from "@/components/TopNavBar";
import { useEffect, useMemo, useState } from "react";

interface TripSegment {
  startStationId: string;
  endStationId: string;
  lineId: string;
}

interface TripSubmission {
  segments: TripSegment[];
  tripDate: Date;
}

interface Line {
  name: string;
  id: string;
  stations: { id: string; name: string }[];
}

interface Station {
  name: string;
  id: string;
}

interface SegmentDraft {
  lineId: string;
  endStationId: string;
}

function normalizeStationKey(name?: string) {
  const normalized = (name || "")
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

  if (
    /\b14\b/.test(normalized) &&
    /\bunion\b/.test(normalized) &&
    /\bsquare\b/.test(normalized)
  ) {
    return "14 union square";
  }

  return normalized;
}

function AddTripModal({
  isOpen,
  onClose,
  onSubmit,
  stations,
  lines,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (trip: TripSubmission) => void;
  stations: Station[];
  lines: Line[];
}) {
  const todayString = new Date().toISOString().split("T")[0];
  const [startStationId, setStartStationId] = useState("");
  const [segments, setSegments] = useState<SegmentDraft[]>([{ lineId: "", endStationId: "" }]);
  const [tripDate, setTripDate] = useState(todayString);
  const [formError, setFormError] = useState("");

  const lookups = useMemo(() => {
    const stationById: Record<string, Station> = {};
    const lineById: Record<string, Line> = {};
    const stationIdsByKey: Record<string, string[]> = {};
    const linesByStationId: Record<string, Line[]> = {};

    stations.forEach((station) => {
      stationById[station.id] = station;
      const key = normalizeStationKey(station.name);
      if (key) {
        if (!stationIdsByKey[key]) stationIdsByKey[key] = [];
        stationIdsByKey[key].push(station.id);
      }
    });

    lines.forEach((line) => {
      lineById[line.id] = line;
      line.stations.forEach((station) => {
        if (!linesByStationId[station.id]) linesByStationId[station.id] = [];
        linesByStationId[station.id].push(line);
      });
    });

    return { stationById, lineById, stationIdsByKey, linesByStationId };
  }, [stations, lines]);

  function resetForm() {
    setStartStationId("");
    setSegments([{ lineId: "", endStationId: "" }]);
    setTripDate(todayString);
    setFormError("");
  }

  function getSegmentContext(index: number) {
    const segment = segments[index];
    const transferOriginStationId = index === 0 ? startStationId : segments[index - 1]?.endStationId || "";
    const transferOrigin = lookups.stationById[transferOriginStationId];
    const transferOriginKey = normalizeStationKey(transferOrigin?.name);
    const transferComplexStationIds =
      transferOriginStationId && transferOriginKey
        ? lookups.stationIdsByKey[transferOriginKey] || [transferOriginStationId]
        : transferOriginStationId
          ? [transferOriginStationId]
          : [];

    const transferLines = Array.from(
      new Map(
        transferComplexStationIds.flatMap((stationId) =>
          (lookups.linesByStationId[stationId] || []).map((line) => [line.id, line] as const)
        )
      ).values()
    );

    const availableLines =
      index === 0
        ? lines
        : transferLines.filter((line) => line.id !== segments[index - 1]?.lineId);

    const firstSegmentLine = lookups.lineById[segments[0]?.lineId];
    const availableStartStations = index === 0 ? firstSegmentLine?.stations || [] : [];

    let resolvedStartStationId = index === 0 ? startStationId : "";
    if (index > 0 && segment?.lineId && transferOriginStationId) {
      const selectedLine = lookups.lineById[segment.lineId];
      const exactMatch = selectedLine?.stations.find((station) => station.id === transferOriginStationId);
      if (exactMatch) {
        resolvedStartStationId = exactMatch.id;
      } else if (selectedLine && transferOriginKey) {
        const byName = selectedLine.stations.find(
          (station) => normalizeStationKey(station.name) === transferOriginKey
        );
        resolvedStartStationId = byName?.id || "";
      }
    }

    const selectedLine = segment?.lineId ? lookups.lineById[segment.lineId] : undefined;
    const availableEndStations =
      selectedLine && resolvedStartStationId
        ? selectedLine.stations.filter((station) => station.id !== resolvedStartStationId)
        : [];

    return {
      transferOriginStationId,
      resolvedStartStationId,
      availableLines,
      availableStartStations,
      availableEndStations,
      titleStationName:
        lookups.stationById[resolvedStartStationId]?.name ||
        lookups.stationById[transferOriginStationId]?.name ||
        "Select previous segment first",
    };
  }

  function updateSegment(index: number, updates: Partial<SegmentDraft>) {
    setSegments((current) =>
      current.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, ...updates } : segment
      )
    );
  }

  function removeSegment(index: number) {
    setSegments((current) => current.filter((_, segmentIndex) => segmentIndex !== index));
  }

  const canAddTransfer = (() => {
    const lastSegment = segments[segments.length - 1];
    if (!lastSegment || !lastSegment.lineId || !lastSegment.endStationId) return false;
    const previewContext = getSegmentContext(segments.length);
    return previewContext.availableLines.length > 0;
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/50 z-50">
      <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-white">Add New Trip 🚇</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setFormError("");

            const builtSegments: TripSegment[] = segments.map((segment, index) => ({
              startStationId: getSegmentContext(index).resolvedStartStationId,
              endStationId: segment.endStationId,
              lineId: segment.lineId,
            }));

            const hasInvalidSegment =
              !startStationId ||
              builtSegments.length === 0 ||
              builtSegments.some(
                (segment) =>
                  !segment.startStationId ||
                  !segment.endStationId ||
                  !segment.lineId ||
                  segment.startStationId === segment.endStationId
              );

            if (hasInvalidSegment) {
              setFormError("Please complete each segment with valid line and stations.");
              return;
            }

            onSubmit({
              segments: builtSegments,
              tripDate: new Date(tripDate),
            });
            resetForm();
            onClose();
          }}
        >
          <div className="space-y-4 mb-6">
            {segments.map((segment, index) => {
              const {
                transferOriginStationId,
                resolvedStartStationId,
                availableLines,
                availableStartStations,
                availableEndStations,
                titleStationName,
              } = getSegmentContext(index);

              return (
                <div key={index} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">
                      Segment {index + 1}:{" "}
                      <span className="text-gray-400 font-normal">{titleStationName}</span>
                    </h3>
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeSegment(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${index === 0 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">Line</label>
                      <select
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        value={segment.lineId}
                        onChange={(e) => {
                          if (index === 0) {
                            setStartStationId("");
                          }
                          updateSegment(index, { lineId: e.target.value, endStationId: "" });
                        }}
                        disabled={index > 0 && !transferOriginStationId}
                        required
                      >
                        <option value="">Select a line</option>
                        {availableLines.map((line) => (
                          <option key={line.id} value={line.id}>
                            {line.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {index === 0 && (
                      <div>
                        <label className="block text-gray-300 font-semibold mb-2">Start Station</label>
                        <select
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          value={startStationId}
                          onChange={(e) => {
                            setStartStationId(e.target.value);
                            updateSegment(0, { endStationId: "" });
                          }}
                          disabled={!segment.lineId}
                          required
                        >
                          <option value="">Select station</option>
                          {availableStartStations.map((station) => (
                            <option key={station.id} value={station.id}>
                              {station.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-gray-300 font-semibold mb-2">
                        {index === segments.length - 1 ? "Destination / Transfer Station" : "Transfer Station"}
                      </label>
                      <select
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        value={segment.endStationId}
                        onChange={(e) => updateSegment(index, { endStationId: e.target.value })}
                        disabled={!segment.lineId || !resolvedStartStationId}
                        required
                      >
                        <option value="">Select station</option>
                        {availableEndStations.map((station) => (
                          <option key={station.id} value={station.id}>
                            {station.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setSegments((current) => [...current, { lineId: "", endStationId: "" }])}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canAddTransfer}
            >
              + Add Transfer Segment
            </button>
            {!canAddTransfer && segments[segments.length - 1]?.endStationId && (
              <p className="text-sm text-gray-400 mt-2">
                No additional transfer lines found at this station.
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 font-semibold mb-2">Trip Date</label>
            <input
              type="date"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={tripDate}
              onChange={(e) => setTripDate(e.target.value)}
              required
            />
          </div>

          {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold transform transition-all duration-200 hover:bg-gray-600 hover:scale-105 active:scale-95"
              onClick={() => {
                resetForm();
                onClose();
              }}
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
  const [stations, setStations] = useState<Station[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [session, setSession] = useState<{ user?: { name?: string; sub?: string } } | null>(null);

  useEffect(() => {
    fetch("/api/auth", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSession(data);
      });
  }, []);

  useEffect(() => {
    fetch(`/api/stations`)
      .then((res) => res.json())
      .then((data) => setStations(data))
      .catch(() => setStations([]));
  }, []);

  useEffect(() => {
    fetch(`/api/lines`)
      .then((res) => res.json())
      .then((data) => setLines(data))
      .catch(() => setLines([]));
  }, []);

  function handleAddTrip(trip: TripSubmission) {
    fetch(`/api/new-trip`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trips: trip.segments.map((segment) => ({
          ...segment,
          tripDate: trip.tripDate,
        })),
        auth0Id: session?.user?.sub || "",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Trip added:", data);
      })
      .catch((err) => {
        console.error("Error adding trip:", err);
      });
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <TopNavBar />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Log Your Trip 📍</h1>
            <p className="text-xl text-gray-400">Track your NYC subway journeys</p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl transform transition-all duration-300 hover:scale-105 hover:border-blue-500">
              <div className="flex items-start gap-4">
                <div className="text-4xl">✏️</div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">Manual Entry</h2>
                  <p className="text-gray-400 mb-6">
                    Log single-line or transfer trips with valid station-to-line connections
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
                    <span className="ml-3 text-xs bg-gray-700 text-gray-400 px-3 py-1 rounded-full">
                      Coming Soon
                    </span>
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
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">💡 Quick Tips</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2 mt-1">
                <span className="text-blue-400 ">•</span>
                <span>Pick your start station first, then each line and transfer segment in order</span>
              </li>
              <li className="flex items-center gap-2 mt-1">
                <span className="text-blue-400 ">•</span>
                <span>Only valid transfer lines are shown based on your selected transfer station</span>
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
  );
}
