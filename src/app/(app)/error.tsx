"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-md text-center">
      <h2 className="mb-2 font-semibold">Something went wrong</h2>
      <p className="mb-4 text-sm text-stone-600">Please try again. If it keeps happening, reload the page.</p>
      <button type="button" className="btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
