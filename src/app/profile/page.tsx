import { auth0 } from "@/lib/auth0";

async function getUserData(auth0Id: string) {
  const res = await fetch(`http://localhost:4000/user/by-auth0/${encodeURIComponent(auth0Id)}`);
  if (!res.ok) return null;
  return res.json();
}

export default async function Profile() {
  const session = await auth0.getSession();
  let userData = null;
  if (session && session.user && session.user.sub) {
    userData = await getUserData(session.user.sub);
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-600 text-white p-4">
        <h1 className="text-2xl font-bold">profile</h1>
      </header>
      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">Hi, {session.user.name}!</h2>
            {userData ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Trips</h3>
                <ul className="mb-4 list-disc list-inside">
                  {userData.trips && userData.trips.length > 0 ? userData.trips.map((trip: any) => (
                    <li key={trip.id}>
                      {trip.startStation} → {trip.endStation} ({trip.startTime})
                    </li>
                  )) : <li>No trips found.</li>}
                </ul>
                <h3 className="text-lg font-semibold mb-2">Favorite Lines</h3>
                <ul className="list-disc list-inside">
                  {userData.favoriteLines && userData.favoriteLines.length > 0 ? userData.favoriteLines.map((line: any) => (
                    <li key={line.id}>{line.name} ({line.color})</li>
                  )) : <li>No favorite lines.</li>}
                </ul>
              </div>
            ) : <p className="text-gray-500">Loading user data...</p>}
          </div>
        ) : null}
      </main>
    </div>
  );
}
