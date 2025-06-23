"use client";

import { useAuth } from "@/components/providers/auth-provider";

export default function ClientDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Client Dashboard
      </h1>

      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-medium">Welcome!</h2>
        <p className="text-gray-600">
          Access your forms and services from the navigation menu.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-medium">Pending Forms</h3>
          <p className="text-3xl font-bold text-indigo-600">0</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-2 text-lg font-medium">Active Services</h3>
          <p className="text-3xl font-bold text-green-600">0</p>
        </div>
      </div>
    </div>
  );
}
