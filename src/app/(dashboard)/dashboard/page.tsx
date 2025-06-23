"use client";

import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="rounded-lg bg-white p-6 shadow transition-all duration-base hover:shadow-md">
        <h2 className="mb-4 text-lg font-medium">Welcome back!</h2>
        <p className="text-gray-600">
          You are logged in as{" "}
          <span className="font-medium">{user?.email}</span> with role{" "}
          <span className="font-medium">{user?.role}</span>.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="group cursor-pointer rounded-lg bg-white p-6 shadow transition-all duration-base hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium transition-colors duration-base group-hover:text-indigo-600">
            Total Clients
          </h3>
          <p className="text-3xl font-bold text-indigo-600 transition-transform duration-base group-hover:scale-105">
            0
          </p>
        </div>

        <div className="group cursor-pointer rounded-lg bg-white p-6 shadow transition-all duration-base hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium transition-colors duration-base group-hover:text-green-600">
            Active Services
          </h3>
          <p className="text-3xl font-bold text-green-600 transition-transform duration-base group-hover:scale-105">
            0
          </p>
        </div>

        <div className="group cursor-pointer rounded-lg bg-white p-6 shadow transition-all duration-base hover:-translate-y-0.5 hover:shadow-md">
          <h3 className="mb-2 text-lg font-medium transition-colors duration-base group-hover:text-yellow-600">
            Pending Requests
          </h3>
          <p className="text-3xl font-bold text-yellow-600 transition-transform duration-base group-hover:scale-105">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
