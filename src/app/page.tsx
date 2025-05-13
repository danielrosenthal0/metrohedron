import { auth0 } from "@/lib/auth0";
// pages/index.js

export default async function Home() {
  const session = await auth0.getSession();


  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">metrohedron</h1>
          <nav>
            {session && session.user ? (
              <div className="flex items-center space-x-4">
                <a href="/profile" className="hover:underline">
                  Profile
                </a>
                <a href="/auth/logout" className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800">
                  Logout
                </a>
              </div>
            ) : (
              <a href="/auth/login" className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800">
                Login
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">Hi, {session.user.name}!</h2>
            <p className="mb-4 text-black">Track your NYC subway journeys.</p>
            <a href="/log-trip" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              Log a Trip
            </a>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">metrohedron</h2>
            <p className="mb-4 text-black">Sign in to start tracking subway journeys.</p>
            <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Get Started
            </a>
          </div>
        )}
      </main>
    </div>
  );
}