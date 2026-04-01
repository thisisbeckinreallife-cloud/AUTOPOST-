import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <p className="mt-4 text-slate-600">Page not found</p>
        <Link href="/dashboard" className="mt-6 inline-block text-sm text-pink-500 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
