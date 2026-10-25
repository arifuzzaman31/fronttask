"use client";

import { useRouter } from "next/navigation";

export default function ErrorPage({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const router = useRouter();
  const message =
    error instanceof Error && error.message
      ? error.message
      : "The page could not be loaded.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded bg-white p-8 text-center shadow-md">
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-4 text-sm text-gray-600">{message}</p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => retry()}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
              } catch {}
              router.push("/");
            }}
            className="rounded bg-gray-200 px-4 py-2"
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}
