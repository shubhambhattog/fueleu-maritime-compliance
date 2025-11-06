import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-900">
      <main className="flex w-full max-w-4xl flex-col gap-8 p-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            FuelEU Maritime Compliance
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Manage routes, compare compliance balance, handle banking and pooling operations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Dashboard →
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Access routes, comparison, banking, and pooling features
            </p>
          </Link>
          
          <a
            href="http://localhost:4000/routes"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              API Docs →
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Test backend endpoints directly (backend must be running)
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}
