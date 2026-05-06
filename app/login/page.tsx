export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Maxx Field Tasks</h1>
        <p className="text-gray-500 text-sm">
          Log meeting notes and create HubSpot tasks from your phone.
        </p>
        <a
          href="/api/auth/login"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          Connect HubSpot
        </a>
      </div>
    </main>
  );
}
