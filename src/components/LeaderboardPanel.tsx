"use client";

import { useEffect, useMemo, useState } from 'react';

type LeaderboardRow = {
  rank: number;
  userId: string;
  auth0Id: string;
  name: string | null;
  email: string;
  rideCount: number;
};

type LeaderboardPayload = {
  scope: string;
  participantCount: number;
  overallLeaderboard: LeaderboardRow[];
  lineLeaderboard: LeaderboardRow[];
  selectedLineId: string | null;
  topLinesForUser: {
    lineId: string;
    lineName: string;
    lineColor: string;
    rideCount: number;
  }[];
};

type Line = {
  id: string;
  name: string;
};

export default function LeaderboardPanel({ auth0Id }: { auth0Id: string }) {
  const [scope, setScope] = useState<'friends' | 'global'>('friends');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [payload, setPayload] = useState<LeaderboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lines')
      .then((response) => response.json())
      .then((data) => {
        const lightweightLines = Array.isArray(data)
          ? data.map((line: { id: string; name: string }) => ({ id: line.id, name: line.name }))
          : [];
        setLines(lightweightLines);
      })
      .catch(() => setLines([]));
  }, []);

  useEffect(() => {
    if (!auth0Id) return;

    const query = new URLSearchParams({ scope });
    if (selectedLineId) query.set('lineId', selectedLineId);

    setError(null);
    fetch(`/api/leaderboard/${auth0Id}?${query.toString()}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          setError(data.error || 'Failed to load leaderboard');
          return;
        }
        setPayload(data);
      })
      .catch(() => setError('Failed to load leaderboard'));
  }, [auth0Id, scope, selectedLineId]);

  const selectedLineName = useMemo(
    () => lines.find((line) => line.id === selectedLineId)?.name || 'Selected line',
    [lines, selectedLineId]
  );

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
          {payload?.participantCount || 0} riders
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <select
          value={scope}
          onChange={(event) => setScope(event.target.value as 'friends' | 'global')}
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
        >
          <option value="friends">Friends</option>
          <option value="global">Global</option>
        </select>

        <select
          value={selectedLineId}
          onChange={(event) => setSelectedLineId(event.target.value)}
          className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
        >
          <option value="">All lines (overall rides)</option>
          {lines.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </select>
      </div>

      {error ? <p className="text-sm text-red-400 mb-4">{error}</p> : null}

      <div className="space-y-3 mb-8">
        <h3 className="text-lg font-semibold text-white">Overall Ride Count</h3>
        {payload?.overallLeaderboard?.map((entry) => (
          <div key={entry.userId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">
                  #{entry.rank} {entry.name || entry.email}
                </p>
                <p className="text-sm text-gray-400">{entry.email}</p>
              </div>
              <p className="text-white font-bold">{entry.rideCount} rides</p>
            </div>
          </div>
        ))}
      </div>

      {selectedLineId ? (
        <div className="space-y-3 mb-8">
          <h3 className="text-lg font-semibold text-white">{selectedLineName} Line Rides</h3>
          {payload?.lineLeaderboard?.map((entry) => (
            <div key={`line-${entry.userId}`} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">
                    #{entry.rank} {entry.name || entry.email}
                  </p>
                  <p className="text-sm text-gray-400">{entry.email}</p>
                </div>
                <p className="text-white font-bold">{entry.rideCount} rides</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Your Top Lines</h3>
        {(payload?.topLinesForUser.length || 0) === 0 ? (
          <p className="text-gray-400">No ride history yet.</p>
        ) : (
          payload?.topLinesForUser.map((line) => (
            <div key={line.lineId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold" style={{ color: line.lineColor }}>
                  {line.lineName}
                </p>
                <p className="text-white font-bold">{line.rideCount} rides</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
