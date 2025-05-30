import { auth0 } from "@/lib/auth0";
import Link from "next/link";

async function getUserData(auth0Id: string) {
  console.log("Fetching user data for auth0Id:", auth0Id);
  const res = await fetch(`http://localhost:4000/user/${encodeURIComponent(auth0Id)}`);
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
        <div className="container mx-auto flex justify-between items-center">

          <h1 className="text-2xl font-bold">metrohedron</h1>
          <div className="flex items-center space-x-4">
          <Link href="/" className="text-white hover:underline">
            Home
          </Link>
          <Link href="/profile" className="text-white hover:underline">
            Profile
          </Link>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">Hi, {session.user.name}!</h2>
            {userData ? (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-black">Trips</h3>
                <ul className="mb-4 list-disc list-inside text-black">
                  {userData.trips && userData.trips.length > 0 ? userData.trips.map((trip: any) => (
                    <p key={trip.id}>
                      {trip.startStation} → {trip.endStation} ({trip.startTime})
                    </p>
                  )) : <p>No trips taken yet.</p>}
                </ul>
                <h3 className="text-lg font-semibold mb-2 text-black">Favorite Lines</h3>
                <ul className="list-disc list-inside text-black">
                  {userData.favoriteLines && userData.favoriteLines.length > 0 ? userData.favoriteLines.map((line: any) => (
                    <p key={line.id}>{line.name} ({line.color})</p>
                  )) : <p>No favorite lines.</p>}
                </ul>
              </div>
            ) : <p className="text-gray-500">Loading user data...</p>}
          </div>
        ) : null}
      </main>
    </div>
  );
}
