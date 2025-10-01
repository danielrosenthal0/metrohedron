import TopNavBar from "@/components/TopNavBar";
import { auth0 } from "@/lib/auth0";
import { PrismaClient } from "@prisma/client";
import 'leaflet/dist/leaflet.css';
import Link from "next/link";
const prisma = new PrismaClient();

async function getUserData(auth0Id: string) {
  console.log("Fetching user data for auth0Id:", auth0Id);
  try {
    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: {
        trips: true,
        favoriteLines: true,
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default async function Profile() {
  const session = await auth0.getSession();
  let userData = null;
  if (session && session.user && session.user.sub) {
    userData = await getUserData(session.user.sub);
  }
  return (
    
    <div className="min-h-screen bg-black-100">
      <TopNavBar />

      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-black p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-white">Hi, {session.user.name}!</h2>
            {userData ? (
              <div>
                <h3 className="text-lg font-semibold mb-2 text-white">Trips</h3>
                <ul className="mb-4 list-disc list-inside text-white">
                  {userData.trips && userData.trips.length > 0 ? userData.trips.map((trip) => (
                    <p key={trip.id}>
                      {trip.startStation} → {trip.endStation} ({trip.tripDate.toISOString().split('T')[0]})
                    </p>
                  )) : <p>No trips taken yet.</p>}
                </ul>
                <h3 className="text-lg font-semibold mb-2 text-white">Favorite Lines</h3>
                <ul className="list-disc list-inside text-white">
                  {userData.favoriteLines && userData.favoriteLines.length > 0 ? userData.favoriteLines.map((line) => (
                    <p key={line.id}>{line.name} </p>
                  )) : <p>No favorite lines.</p>}
                </ul>
              <Link
                href="/auth/logout"
                className="text-white bg-red-500 px-3 py-1 rounded hover:bg-red-700"
              >
                Log Out
              </Link>
              </div>
              
            ) : <p className="text-white-500">Loading user data...</p>}
            
          </div>
        ) : null}
      </main>
    </div>
  );
}
