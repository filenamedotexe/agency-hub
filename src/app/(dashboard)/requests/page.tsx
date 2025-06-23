"use client";

export default function RequestsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700">
          New Request
        </button>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">
          Requests will be displayed here in both Kanban and List views.
        </p>
      </div>
    </div>
  );
}
