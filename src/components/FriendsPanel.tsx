"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';

type Friend = {
  friendshipId: string;
  since: string | null;
  user: {
    id: string;
    auth0Id: string;
    name: string | null;
    email: string;
    totalRides: number;
  };
};

type IncomingRequest = {
  friendshipId: string;
  createdAt: string;
  from: {
    id: string;
    auth0Id: string;
    name: string | null;
    email: string;
    totalRides: number;
  };
};

type OutgoingRequest = {
  friendshipId: string;
  createdAt: string;
  to: {
    id: string;
    auth0Id: string;
    name: string | null;
    email: string;
    totalRides: number;
  };
};

type FriendsPayload = {
  friends: Friend[];
  incomingRequests: IncomingRequest[];
  outgoingRequests: OutgoingRequest[];
};

export default function FriendsPanel({ auth0Id }: { auth0Id: string }) {
  const [payload, setPayload] = useState<FriendsPayload | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/friends/${auth0Id}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load friends');
      }
      setPayload(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [auth0Id]);

  useEffect(() => {
    if (!auth0Id) return;
    loadFriends();
  }, [auth0Id, loadFriends]);

  async function submitFriendRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!targetEmail.trim()) return;

    setMessage(null);
    const response = await fetch('/api/friends/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth0Id, targetEmail: targetEmail.trim().toLowerCase() }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Unable to send request');
      return;
    }

    setTargetEmail('');
    setMessage(data.state === 'AUTO_ACCEPTED' ? 'Friend request matched and auto-accepted.' : 'Friend request sent.');
    await loadFriends();
  }

  async function respond(friendshipId: string, action: 'accept' | 'decline' | 'cancel') {
    setMessage(null);
    const response = await fetch('/api/friends/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auth0Id, friendshipId, action }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Unable to update request');
      return;
    }

    await loadFriends();
  }

  return (
    <section className="bg-gray-800 border border-gray-700 rounded-2xl p-8 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Friends</h2>
        <span className="text-sm font-normal text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
          {payload?.friends.length || 0}
        </span>
      </div>

      <form onSubmit={submitFriendRequest} className="flex flex-col md:flex-row gap-3 mb-6">
        <input
          type="email"
          value={targetEmail}
          onChange={(event) => setTargetEmail(event.target.value)}
          placeholder="Friend's email"
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
          required
        />
        <button
          type="submit"
          className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold"
        >
          Send Request
        </button>
      </form>

      {message ? <p className="text-sm text-gray-300 mb-4">{message}</p> : null}
      {loading && !payload ? <p className="text-gray-400">Loading friends...</p> : null}

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
        {(payload?.incomingRequests.length || 0) === 0 ? (
          <p className="text-gray-400">No incoming requests.</p>
        ) : (
          payload?.incomingRequests.map((item) => (
            <div key={item.friendshipId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{item.from.name || item.from.email}</p>
                  <p className="text-sm text-gray-400">{item.from.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => respond(item.friendshipId, 'accept')}
                    className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => respond(item.friendshipId, 'decline')}
                    className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-white">Pending Sent Requests</h3>
        {(payload?.outgoingRequests.length || 0) === 0 ? (
          <p className="text-gray-400">No pending sent requests.</p>
        ) : (
          payload?.outgoingRequests.map((item) => (
            <div key={item.friendshipId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{item.to.name || item.to.email}</p>
                  <p className="text-sm text-gray-400">{item.to.email}</p>
                </div>
                <button
                  onClick={() => respond(item.friendshipId, 'cancel')}
                  className="px-3 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Your Friends</h3>
        {(payload?.friends.length || 0) === 0 ? (
          <p className="text-gray-400">No friends added yet.</p>
        ) : (
          payload?.friends.map((item) => (
            <div key={item.friendshipId} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{item.user.name || item.user.email}</p>
                  <p className="text-sm text-gray-400">{item.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total rides</p>
                  <p className="text-white font-semibold">{item.user.totalRides}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
