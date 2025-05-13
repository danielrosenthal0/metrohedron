import { auth0 } from "@/lib/auth0";

export default async function Profile() {
  const session = await auth0.getSession();
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-slate-600 text-white p-4">
        <h1 className="text-2xl font-bold">profile</h1>
      </header>
      <main className="container mx-auto p-4">
        {session && session.user ? (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-black">Hi, {session.user.name}!</h2>
          </div>
        ) : null}
      </main>
    </div>
  );
}
